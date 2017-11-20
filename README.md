# ajaxCache
对$.ajax()的二次封装。缓存异步请求的返回结果,并根据习惯自定义了API，仅1.47K

![动画](http://oaaq2vqkp.bkt.clouddn.com/1.gif)

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

+ _cacheInterval_
缓存时间（单位毫秒），不填默认为60分钟

## 方法
 + _load(url)_    
 异步请求代码片段   
 
 + _post(url[,data][,dataType])_  
data可选，不填默认为{}； dataType可选，不填默认为json。下同

 + _get(url[,data][,dataType])_   
 
 + _syncPost(url[,data][,dataType])_ 
 
 + _syncGet(url[,data][,dataType])_   
 
 + _clear()
 删除缓存。 
 
 + _abort()_   
 中断异步请求  

 + _cache_    
 返回一个对象，每次异步请求都以key是url + $.param(data)缓存其中。 
 
