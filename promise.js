(function(global, factory) {
  //判断所在的环境，输出Promise
  //如何判断amd和cmd
  if(typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  }else if(typeof define === "function" && (define.amd || define.cmd)) {
    define(factory);
  }else {
    global.Promise = factory();
  }
})(global, function () {
  var State = {
    PENDING: 0,
    FULFILLED: 1,
    REJECTED: 2
  };

  var Promise = function(resolver) {
    if(!isFunction(resolver)) {
      throw new TypeError("error: resolver is not a function");
    }

    var promise = this;
    promise._state = State.PENDING;
    promise._chain = [];
    promise._value = undefined;

    invoke(promise, resolver);
  };

  function invoke(promise, resolver) {
    function callResolve(value) {
      resolve(promise, value);
    }
    function callReject(value) {
      reject(promise, value);
    }
    try {
      resolver(callResolve, callReject);
    } catch (exception) {
      callReject(exception);
    }
  }

  function async(asyncFunc) {
    //Browser: setTimeout
    //node: process.nextTick();
    setTimeout(asyncFunc, 0);
  }

  function resolve(promise, x) {
    if(promise === x) {
      //If promise and x refer to the same object, reject promise with a TypeError as the reason.
      reject(promise, new TypeError("promise === x"));
    }else if(x instanceof Promise) {
      //因为x是resolve传入的值，如果x是Promise对象，毫无疑问要根据x的状态获取真正传入的值
      //If x is a promise, adopt its state
      if(x._state === State.PENDING) {
        //If x is pending, promise must remain pending until x is fulfilled or rejected.
        x.then(function(value) {
          resolve(promise, value);
        }, function(value) {
          reject(promise, value);
        });
      }else if(x._state === State.FULFILLED) {
        //If/when x is fulfilled, fulfill promise with the same value.
        fulfill(promise, x._value);
      }else if(x._state === State.REJECTED) {
        //If/when x is rejected, reject promise with the same reason.
        reject(promise, x._value);
      }
    }else if(isObjectOrFunction(x)) {
      //将then=x.then，传入的可能是一个thenable的对象，和传入promise相同调用then等待状态变化
      //由于考虑到ES5的getter特性可能会产生副作用，因此在获取x.then属性时，应该形如以下方式，防止多次调用x.then。
      //typeof(then) === 'function' && then.call(x, resolvePromise, rejectPromise)
      //Otherwise, if x is an object or function,

      //Let then be x.then.

      //If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
      var isCalled = false;
      try {
        var then = x.then;
        if(isFunction(then)) {
          //If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise, where:
          then.call(x, function(value) {
            //If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
            isCalled || resolve(promise, value);
            isCalled = true;
          }, function(value) {
            //If/when rejectPromise is called with a reason r, reject promise with r.
            isCalled || reject(promise, value);
            isCalled = true;
          });
        }else {
          //不是thenable对象时，直接fulfill
          //If then is not a function, fulfill promise with x.
          fulfill(promise, x);
        }
      }catch(exception) {
        //If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.

        //If calling then throws an exception e,
        //If resolvePromise or rejectPromise have been called, ignore it.
        //Otherwise, reject promise with e as the reason.
        isCalled || reject(promise, exception);
        isCalled = true;
      }
    }else {
      //此时，x为string、number、boolean
      //If x is not an object or function, fulfill promise with x.
      fulfill(promise, x);
    }
  }
  function reject(promise, value) {
    if(promise._state === State.PENDING) {
      promise._state = State.REJECTED;
      promise._value = value;
      callChain(promise);
    }
  }
  function fulfill(promise, value) {
    if(promise._state === State.PENDING) {
      promise._state = State.FULFILLED;
      promise._value = value;
      callChain(promise);
    }
  }

  function callChain(promise) {
    if(promise._state !== State.PENDING) {
      var chain = promise._chain;
      async(function() {
        while(chain.length > 0) {
          var item = chain.shift();
          var value = null;
          try{
            if(promise._state === State.FULFILLED) {
              //If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1.
              value = (item.onFulfilled? item.onFulfilled: function(value) {return value;})(promise._value);
            }else if(promise._state === State.REJECTED) {
              //If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason as promise1.
              value = (item.onRejected? item.onRejected: function(value) {throw value;})(promise._value);
            }
          }catch (exception) {
            //If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
            reject(item.newPromise, exception);
            continue;
          }
          //If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
          resolve(item.newPromise, value);
        }
      });
    }
  }

  function isFunction(func) {
    return typeof func === "function";
  }
  function isObjectOrFunction(obj) {
    //how to deal with null???
    return (typeof obj === "object" && obj !== null) || isFunction(obj);
  }
  function isArray(arr) {
    return arr instanceof Array;
  }

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var promise = this;
    var newPromise = new Promise(function() {});

    onFulfilled = (typeof onFulfilled === "function")? onFulfilled: null;
    onRejected = (typeof onRejected === "function")? onRejected: null;

    promise._chain.push({
      onFulfilled: onFulfilled,
      onRejected: onRejected,
      newPromise: newPromise
    });

    callChain(promise);

    return newPromise;
  };

  //添加es6的新特性
  Promise.resolve = function(value) {
    //如果是promise对象，或thenable对象
    if(value !== null && value instanceof Promise) {
      return value;
    }else if(value !== null && isFunction(value.then)) {
      return new Promise(function(resolve, reject) {
        value.then(resolve, reject);
      });
    }

    return new Promise(function(resolve, reject) {
      resolve(value);
    });
  };
  Promise.reject = function(value) {
    return new Promise(function(resolve, reject) {
      reject(value);
    });
  };
  Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
  };
  Promise.all = function(promises) {
    //1、参数必须是数组
    if(!isArray(promises)) {
      throw new TypeError("promises must be Array!");
    }

    return new Promise(function(resolve, reject) {
      var results = [];

      //（1）只有p1、p2、p3的状态都变成fulfilled，p的状态才会变成fulfilled，此时p1、p2、p3的返回值组成一个数组，传递给p的回调函数。
      function thenResolve(value) {
        results.push(value);
        if(results.length == promises.length) {
          resolve(results);
        }
      }
      //（2）只要p1、p2、p3之中有一个被rejected，p的状态就变成rejected，此时第一个被reject的实例的返回值，会传递给p的回调函数。
      function thenReject(value) {
        reject(value);
      }

      //2、如果元素不是promise对象，调用Promise.resolve
      for(var i in promises){
        promises[i] = Promise.resolve(promises[i]);
        promises[i].then(thenResolve, thenReject);
      }
    });
  };
  Promise.race = function(promises) {
    if(!isArray(promises)) {
      throw new TypeError("promises must be Array!");
    }

    return new Promise(function(resolve, reject) {
      //和all不同，只要有一个的状态改变了，就改变状态
      function thenResolve(value) {
        resolve(value);
      }
      function thenReject(value) {
        reject(value);
      }

      for(var i in promises){
        promises[i] = Promise.resolve(promises[i]);
        promises[i].then(thenResolve, thenReject);
      }
    });
  };

  return Promise;
});
