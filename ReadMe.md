# cu-promise

这是遵循 [promises/A+](https://github.com/promises-aplus/promises-spec) 规范实现的 Promise 

并使用 [promises-aplus/promises-tests](https://github.com/promises-aplus/promises-tests) 对这个 Promise 是否符合规范，进行了测试

## promise/A+

1. 每个 Promise 对象都有三个状态

	* pending：可以转换成 fulfilled 状态
	* fulfilled：不能转换成别的状态；并且此时 promise 必须要有一个 value
	* rejected：不能转换成别的状态；并且此时必须要有 reject 的reason

			  var State = {
			  	PENDING: 0,
    			FULFILLED: 1,
    			REJECTED: 2
  		  	  };

2. Promise.prototype.then(onFulfilled, onRejected)
	
	then 方法是 Promise 的核心。then 方法传入两个函数参数：	
	* onFulfilled 函数获取 fulfilled 状态下的 value 并进行处理
	* onRejected 函数获取 rejected 状态下的 reason 并进行相应处理
	* 最后返回新的 promise 对象
	
3. \[[Resolve]](promise, x)
	
	promise 的 resolve 函数的处理流程，在 promise/A+ 中有很清晰的说明
			
## 添加 ES6 特性

ES6 的 Promise 本身就是实现了 promise/A+ 规范，并在规范的基础上添加了一些更实用的方法。

对 ES6 不熟悉的推荐看阮一峰老师的 [ECMAScript 6 入门](http://es6.ruanyifeng.com/#docs/promise)

* Promise.resolve
* Promise.reject
* Promise.prototype.catch
* Promise.all
* Promise.race
* Promise.prototype.done
* Promise.prototype.finally