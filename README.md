# ajaxCache
对$.ajax()的二次封装。缓存异步请求的返回结果,并根据习惯自定义了API，仅1.47K

注：代码参考自参考：http://www.cnblogs.com/lyzg/p/5370127.html

## 安装

支持直接引入,如下：

```javascript
<script src="jquery.js"></script>
<script src="ajaxCache.js"></script>
<script>
   // 函数执行结果生成一个对象，自带7个属性，相见文档 
    var Ajax = AjaxCache({cacheInterval: 1000 * 1000});
    
    Ajax.post('common/queryPhoneNumber.json', {name: 'soon'}).done(function(data) {
      console.log(data);
    })
    
</script>
```
  同时也支持CMD或AMD的引入方式。

## options

_cacheInterval_
缓存时间（单位毫秒），不填默认为60分钟

## 方法
 _load(url,data[,dataType])_   //dataType，不写默认“json”  
 _post(url,data[,dataType])_  
 _get(url,data[,dataType])_   
 _syncPost(url,data[,dataType])_ 
 _syncGet(url,data[,dataType])_  
 _cache    所有异步请求的缓存 
 _abort()_  中断异步请求   
