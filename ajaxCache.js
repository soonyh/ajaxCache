/**
 * 对$.ajax()的二次封装，
 * 缓存每次异步请求的返回结果,并自定义了API
 * 参考：http://www.cnblogs.com/lyzg/p/5370127.html
 *
 * 说明：
 * 引入即声明了一个函数AjaxCache(option);
 * @cacheInterval  缓存有效时间，毫秒为单位，默认是60分钟
 *
 * 用法：
 * var Ajax = AjaxCache({ cacheInterval: 1000 * 1000 });
 * 函数执行结果生成一个对象，自带7个属性，如下
 * Ajax.load(url,data[,dataType])   //dataType，不写默认“json”
 * Ajax.post(url,data[,dataType])
 * Ajax.get(url,data[,dataType])
 * Ajax.syncPost(url,data[,dataType])
 * Ajax.syncGet(url,data[,dataType])
 * Ajax.cache    所有异步请求的缓存
 * Ajax.abort()  中断异步请求
 * Ajax.clear()  清除缓存
 */
!(function(root, name, factory) {
    // 检测上下文环境是否为AMD或CMD
    var hasDefine = typeof define === 'function',
        // 检查上下文环境是否为Node
        hasExports = typeof module !== 'undefined' && module.exports;
    if (hasDefine) {
        // AMD环境或CMD环境
        define(factory);
    } else if (hasExports) {
        // 定义为普通Node模块
        module.exports = factory();
    } else {
        // 将模块的执行结果挂在window变量中，在浏览器中this指向window对象
        root[name] = factory();
    }
})(window, 'AjaxCache', function() {
    //根据关键的几个参数统一创建ajax对象
    function create(_url, _method, _data, _async, _dataType) {
        //添加随机数
        if (_url.indexOf('?') > -1) {
            _url = _url + '&rnd=' + Math.random();
        } else {
            _url = _url + '?rnd=' + Math.random();
        }
        //为请求添加ajax标识，方便后台区分ajax和非ajax请求
        _url += '&_ajax=1';
        //返回jquery创建的ajax对象，以便外部拿到这个对象以后可以通过
        //.done .fail .always来添加回调
        //这么做是为了保留jquery ajax中好用的部分
        return $.ajax({
            url: _url,
            dataType: _dataType,
            async: _async,
            type: _method,
            data: _data
        });
    };
    //ajax就是本组件全局唯一的实例，它的实例方法通过后面的循环代码添加
    //methods对象配置ajax各个实例方法的参数：
    //name: 方法名称
    //type: http请求方法，get or post
    //async: 发送请求时是否异步
    //dataType: 返回的数据类型，html or json
    var Ajax = {},
        methods = [{
            name: 'load',
            method: 'get',
            async: true,
            dataType: 'html'
        }, {
            name: 'get',
            method: 'get',
            async: true,
            dataType: 'json'
        }, {
            name: 'post',
            method: 'post',
            async: true,
            dataType: 'json'
        }, {
            name: 'syncGet',
            method: 'get',
            async: false,
            dataType: 'json'
        }, {
            name: 'syncPost',
            method: 'post',
            async: false,
            dataType: 'json'
        }];
    //由于二次封装需要对外提供的每个实例方法创建ajax的逻辑是相同的
    //所以通过这种方式统一定义各个实例方法
    //关键代码为下面代码中的那个立即调用的函数
    //它返回了一个新的闭包函数作为实例方法
    for (var i = 0, l = methods.length; i < l; i++) {
        Ajax[methods[i].name] = (function(i) {
            return function() {
                /**
                 * 每个实例方法接收三个参数
                 * 第一个表示要请求的地址
                 * 第二个表示要提交到后台的数据，是一个object对象，如{param1: 'value1'}
                 * 第三个表示后台返回的数据类型，最最常用的就是html or json，绝大部分情况下这个参数不用传，会使用methods里面定义的dataType
                 */
                var _url = arguments[0],
                    _data = arguments[1],
                    _dataType = arguments[2] || methods[i].dataType;
                return create(_url, methods[i].method, _data, methods[i].async, _dataType);
            }
        })(i);
    }
    //缓存列表
    var cache = {};
    //存储每次异步请求的xhr，方便后面暴露出来，由外部控制异步中断
    var asyncTasks = [];
    /**
     * 生成缓存索引：
     * 由于索引是根据url和data生成的（data是一个对象，存放Ajax要提交到后台的数据）
     * 所以要想同一个url，同样的data能够有效地使用缓存，
     * 切勿在url和data中包含每次可变的参数值，如随机数等
     * 比如有一个请求：
     * url: aaa/bbb/cccc?r=0.312738
     * data: {name: 'json'}
     * 其中url后面的r是一个随机数，每次外部发起这个请求时，r的值都会变化
     * 由于r每次都不同，最终会导致缓存索引不相同，结果缓存就无法命中
     * 注：随机数可放置在原始的Ajax组件内
     *
     * 还有：如果是同一个接口，最好在同一个页面内，统一url的路径类型，要么都是相对路径，要么都是绝对路径
     * 否则也会导致缓存无法有效管理
     */
    function generateCacheKey(url, data) {
        return url + $.param(data);
    };
    return function(opts) {
        opts = opts || {};
        var cacheInterval = opts.cacheInterval || (1000 * 60 * 60); //缓存有效时间，默认60分钟
        var proxy = {};
        for (var i in Ajax) {
            if (Object.prototype.hasOwnProperty.call(Ajax, i)) {
                //在proxy对象上定义Ajax组件每一个实例方法的代理
                //注意这个立即调用的函数表达式
                //它返回了一个闭包函数就是最终的代理方法
                proxy[i] = (function(i) {
                    return function() {
                        var _url = arguments[0],
                            _data = arguments[1] || {},
                            cacheKey = generateCacheKey(_url, _data),
                            cacheItem = cache[cacheKey],
                            isCacheValid = false;
                        if (cacheItem) {
                            var curTime = +new Date();
                            if (curTime - cacheItem.cacheStartTime <= cacheInterval) {
                                //如果请求时间跟缓存开始时间的间隔在缓存有效时间范围内，就表示缓存是有效的
                                isCacheValid = true;
                            } else {
                                //否则就把缓存清掉
                                delete cache[cacheKey];
                            }
                        }
                        if (isCacheValid) {
                            //返回的对象跟原始Ajax组件调用返回的对象有相同的API
                            //这是代理的关键：代理对象与被代理的对象应该具有相同API
                            //只有这样当我们取消代理的时候，不会对那些用了代理的组件进行修改
                            return cacheItem.jqXHR;
                        }
                        //缓存失效或者没有缓存的时候调用原始的Ajax组件的同名方法去后台请求数据
                        var _jqXHR = Ajax[i].apply(Ajax, arguments);
                        asyncTasks.push(_jqXHR);
                        return _jqXHR.done(function(res) {
                            //在请求成功之后将结果缓存，并记录当前时间作为缓存的开始时间
                            cache[cacheKey] = {
                                res: res,
                                cacheStartTime: +new Date(),
                                jqXHR: _jqXHR
                            }
                        });
                    }
                })(i);
                //对外暴露cache
                proxy['cache'] = cache;
                //对外暴露一个abort方法，便于中断异步请求
                proxy['abort'] = function() {
                    $.each(asyncTasks, function(index, val) {
                        val.abort();
                        console.log('abort');
                    })
                };
                //对外暴露一个clear方法，便于清除缓存
                proxy['clear'] = function() {
                    proxy['cache'] = cache = {};
                     console.log('clear');
                };
            }
        }
        return proxy;
    };
});
