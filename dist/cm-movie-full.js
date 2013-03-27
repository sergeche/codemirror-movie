//     Underscore.js 1.4.3
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // with specific `key:value` pairs.
  _.where = function(obj, attrs) {
    if (_.isEmpty(attrs)) return [];
    return _.filter(obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, context) {
    var args, bound;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + (0 | Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = '' + ++idCounter;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

/**
 * requestAnimationFrame polyfill by Erik Möller
 * fixes from Paul Irish and Tino Zijdel
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 */
(function() {
	var lastTime = 0;
	var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = (new Date()).getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

(function(global) {
	var dummyFn = function() {};
	var anims = [];
	
	var defaults = {
		duration: 500, // ms
		easing: 'linear',
		step: dummyFn,
		complete: dummyFn,
		autostart: true
	};
	
	var easings = {
		linear: function(t, b, c, d) {
			return c * t / d + b;
		},
		easeInQuad: function(t, b, c, d) {
			return c*(t/=d)*t + b;
		},
		easeOutQuad: function(t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		},
		easeInOutQuad: function(t, b, c, d) {
			if((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 *((--t)*(t-2) - 1) + b;
		},
		easeInCubic: function(t, b, c, d) {
			return c*(t/=d)*t*t + b;
		},
		easeOutCubic: function(t, b, c, d) {
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOutCubic: function(t, b, c, d) {
			if((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		},
		
		easeInExpo: function(t, b, c, d) {
			return(t==0) ? b : c * Math.pow(2, 10 *(t/d - 1)) + b - c * 0.001;
		},
		easeOutExpo: function(t, b, c, d) {
			return(t==d) ? b+c : c * 1.001 *(-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOutExpo: function(t, b, c, d) {
			if(t==0) return b;
			if(t==d) return b+c;
			if((t/=d/2) < 1) return c/2 * Math.pow(2, 10 *(t - 1)) + b - c * 0.0005;
			return c/2 * 1.0005 *(-Math.pow(2, -10 * --t) + 2) + b;
		},
		
		easeInElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
			if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOutElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
			if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
			return(a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p ) + c + b);
		},
		easeInOutElastic: function(t, b, c, d, a, p) {
			var s;
			if(t==0) return b; 
			if((t/=d/2)==2) return b+c;
			if(!p) p=d*(.3*1.5);
			if(!a || a < Math.abs(c)) { a=c; s=p/4; }       else s = p/(2*Math.PI) * Math.asin(c/a);
			if(t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		},
		easeInBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOutBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOutBack: function(t, b, c, d, s) {
			if(s == undefined) s = 1.70158;
			if((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		},
		easeInBounce: function(t, b, c, d) {
			return c - $.easing.easeOutBounce(x, d-t, 0, c, d) + b;
		},
		easeOutBounce: function(t, b, c, d) {
			if((t/=d) <(1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if(t <(2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if(t <(2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOutBounce: function(t, b, c, d) {
			if(t < d/2) return $.easing.easeInBounce(x, t*2, 0, c, d) * .5 + b;
			return $.easing.easeOutBounce(x, t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	};
	
	function mainLoop() {
		if (!anims.length) {
			// no animations left, stop polling
			return;
		}
		
		var now = +new Date;
		var filtered = [], tween, opt;

		// do not use Array.filter() of _.filter() function
		// since tween’s callbacks can add new animations
		// in runtime. In this case, filter function will loose
		// newly created animation
		for (var i = 0; i < anims.length; i++) {
			tween = anims[i];
			var opt = tween.options;
			if (tween.pos === 1 || tween.endTime <= now) {
				opt.step.call(tween, tween.pos = 1);
				tween.stop();
			} else {
				tween.pos = opt.easing(now - tween.startTime, 0, 1, opt.duration);
				opt.step.call(tween, tween.pos);
				filtered.push(tween);
			}			
		};
	
		anims = filtered;

		if (anims.length) {
			requestAnimationFrame(mainLoop);
		}
	}
	
	function addToQueue(tween) {
		if (_.indexOf(anims, tween) == -1) {
			anims.push(tween);
			if (anims.length == 1)
				mainLoop();
		}
	}
	
	function Tween(options) {
		this.options = _.extend({}, defaults, options || {});
		
		var e = this.options.easing;
		if (_.isString(e)) {
			if (!easings[e])
				throw 'Unknown "' + e + '" easing function';
			this.options.easing = easings[e];
		}
		
		if (!_.isFunction(this.options.easing))
			throw 'Easing should be a function';

		this._id = _.uniqueId('tw');
		
		if (this.options.autostart)
			this.start();
	}
	
	Tween.prototype = {
		/**
		 * Start animation from the beginning
		 */
		start: function() {
			this.pos = 0;
			this.startTime = +new Date;
			this.endTime = this.startTime + this.options.duration;
			this.animating = true;
			addToQueue(this);
		},
		
		/**
		 * Stop animation
		 */
		stop: function() {
			this.animating = false;
			this.options.complete();
		}
	};

	Tween.__getAnims = function() {
		return anims;
	};
	
	global.Tween = Tween;
})(this);
/**
 * Small DOM utility library
 */
(function(global) {
	"use strict";
	var w3cCSS = document.defaultView && document.defaultView.getComputedStyle;
	
	function toCamelCase(name) {
		return name.replace(/\-(\w)/g, function(str, p1) {
			return p1.toUpperCase();
		});
	}
	
	/**
	 * Returns CSS property value of given element.
	 * @author jQuery Team
	 * @param {Element} elem
	 * @param {String} name CSS property value
	 */
	function getCSS(elem, name) {
		var rnumpx = /^-?\d+(?:px)?$/i,
			rnum = /^-?\d(?:\.\d+)?/,
			rsuf = /\d$/;
		
		
		var nameCamel = toCamelCase(name);
		// If the property exists in style[], then it's been set
		// recently (and is current)
		if (elem.style[nameCamel]) {
			return elem.style[nameCamel];
		} 
			
		if (w3cCSS) {
			var cs = window.getComputedStyle(elem, '');
			return cs.getPropertyValue(name);
		}
		
		if (elem.currentStyle) {
			var ret = elem.currentStyle[name] || elem.currentStyle[nameCamel];
			var style = elem.style || elem;
			
			// From the awesome hack by Dean Edwards
			// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
			
			// If we're not dealing with a regular pixel number
			// but a number that has a weird ending, we need to convert it to pixels
			if (!rnumpx.test(ret) && rnum.test(ret)) {
				// Remember the original values
				var left = style.left, rsLeft = elem.runtimeStyle.left;
				
				// Put in the new values to get a computed value out
				elem.runtimeStyle.left = elem.currentStyle.left;
				var suffix = rsuf.test(ret) ? 'em' : '';
				style.left = nameCamel === 'fontSize' ? '1em' : (ret + suffix || 0);
				ret = style.pixelLeft + 'px';
				
				// Revert the changed values
				style.left = left;
				elem.runtimeStyle.left = rsLeft;
			}
			
			return ret;
		}
	}

	/**
	 * Sets CSS properties to given element
	 * @param {Element} elem
	 * @param {Object} params CSS properties to set
	 */
	function setCSS(elem, params) {
		if (!elem) {
			return;
		}

		var numProps = {'line-height': 1, 'z-index': 1, opacity: 1};
		
		var props = _.map(params, function(v, k) {
			var name = k.replace(/([A-Z])/g, '-$1').toLowerCase();
			return name + ':' + ((_.isNumber(v) && !(name in numProps)) ? v + 'px' : v);
		});

		elem.style.cssText += ';' + props.join(';');
	}
	
	/**
	 * @returns {Array}
	 */
	function ar(obj) {
		if (obj.length === +obj.length) {
			return _.toArray(obj);
		}
		
		return _.isArray(obj) ? obj : [obj];
	}
	
	_.extend(global, {
		/**
		 * Trims whitespace from string
		 * @param {String} str
		 * @returns {String}
		 */
		trim: function(str) {
			if (str && 'trim' in String.prototype) {
				return str.trim();
			}
			
			return str.replace(/^\s+/, '').replace(/\s+$/, '');
		},
		
		/**
		 * Check if element contains given class
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Boolean}
		 */
		hasClass: function(elem, className) {
			return ~(' ' + elem.className + ' ').indexOf(' ' + className + ' ');
		},
		
		/**
		 * Adds class name to given element
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Element}
		 */
		addClass: function(elem, className) {
			_.each(ar(elem), function(el) {
				var classes = _.filter(className.split(/\s+/g), function(c) {
					return c && !this.hasClass(el, c);
				}, this);
				
				if (classes.length) {
					el.className += (el.className ? ' ' : '') + classes.join(' ');
				}
			}, this);
			
			return elem;
		},
		
		/**
		 * Removes given class name from specified element
		 * @param {Element} elem
		 * @param {String} className
		 * @return {Element}
		 */
		removeClass: function(elem, className) {
			var reSplit = /\s+/g;
			_.each(ar(elem), function(el) {
				el.className = _.difference((el.className || '').split(reSplit), className.split(/\s+/g)).join(' ');
			}, this);
			
			return elem;
		},
		
		/**
		 * Toggles given class on specified element
		 * @param {Element} elem
		 * @param {String} className
		 * @param {Boolean} cond
		 * @returns {Element}
		 */
		toggleClass: function(elem, className, cond) {
			_.each(ar(elem), function(el) {
				var c = cond;
				if (_.isUndefined(c)) {
					c = this.hasClass(el, className);
				}
				
				if (c) {
					this.removeClass(el, className);
				} else {
					this.addClass(el, className);
				}
			}, this);
			
			return elem;
		},
		
		/**
		 * Find elements with given class inside specified context element
		 * @param {String} className
		 * @param {Element} context Context element, default is <code>document</code> 
		 * @returns {Array}
		 */
		getByClass: function(className, context) {
			if (document.getElementsByClassName) {
				return (context || document).getElementsByClassName(className);
			}
			 
			return _.filter((context || document).getElementsByTagName('*'), function(elem) {
				return this.hasClass(elem, className);
			}, this);
		},
		
		/**
		 * Removes element from parent
		 * @param {Element} elem
		 * @returns {Element}
		 */
		remove: function(elem) {
			_.each(ar(elem), function(el) {
				if (el.parentNode) {
					el.parentNode.removeChild(el);
				}
			});
			
			return elem;
		},
		
		/**
		 * Renders string into DOM element
		 * @param {String} str
		 * @returns {Element}
		 */
		toDOM: function(str) {
			var div = document.createElement('div');
			div.innerHTML = str;
			return div.firstChild;
		},
		
		/**
		 * Sets or retrieves CSS property value
		 * @param {Element} elem
		 * @param {String} prop
		 * @param {String} val
		 */
		css: function(elem, prop, val) {
			if (_.isString(prop) && _.isUndefined(val)) {
				return getCSS(elem, prop);
			}
			
			if (_.isString(prop)) {
				var obj = {};
				obj[prop] = val;
				prop = obj;
			}
			
			setCSS(elem, prop);
		}
	});
})(_.dom = {});
CodeMirror.scenario = (function() {
	"use strict";
	var STATE_IDLE  = 'idle';
	var STATE_PLAY  = 'play';
	var STATE_PAUSE = 'pause';
	
	// Regular expression used to split event strings
	var eventSplitter = /\s+/;
	
	// Create a local reference to slice/splice.
	var slice = Array.prototype.slice;
	
	var defaultOptions = {
		beforeDelay: 1000,
		afterDelay: 1000
	};
	
	// detect CSS 3D Transforms for smoother animations 
	var has3d = (function() {
		var el = document.createElement('div');
		var cssTransform = prefixed('transform');
		if (cssTransform) {
			el.style[cssTransform] = 'translateZ(0)';
			return (/translatez/i).test(el.style[cssTransform]); 
		}
		
		return false;
	})();
	
	// borrow CSS prefix detection from Modernizr
	function prefixed(prop) {
		var prefixes = ['Webkit', 'Moz', 'O', 'ms'];
		var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1);
		var props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
		var el = document.createElement('div');
		var p = null;
		for (var i in props) {
			p = props[i];
			if (el.style[p] !== undefined) {
				return p;
			}
		}

		return p;
	}
	
	var actionsDefinition = {
		/**
		 * Type-in passed text into current editor char-by-char
		 * @param {Object} options Current options
		 * @param {CodeMirror} editor Editor instance where action should be 
		 * performed
		 * @param {Function} next Function to call when action performance
		 * is completed
		 * @param {Function} timer Function that creates timer for delayed 
		 * execution. This timer will automatically delay execution when
		 * scenario is paused and revert when played again 
		 */
		'type': function(options, editor, next, timer) {
			options = makeOptions(options, 'text', {
				text: '',  // text to type
				delay: 60, // delay between character typing
				pos: null  // initial position where to start typing
			});
			
			if (!options.text) {
				throw 'No text provided for "type" action';
			}
			
			if (options.pos !== null) {
				editor.setCursor(makePos(options.pos, editor));
			}
			
			var chars = options.text.split('');
			
			timer(function perform() {
				var ch = chars.shift();
				editor.replaceSelection(ch, 'end');
				if (chars.length) {
					timer(perform, options.delay);
				} else {
					next();
				}
			}, options.delay);
		},
		
		/**
		 * Wait for a specified timeout
		 * @param options
		 * @param editor
		 * @param next
		 * @param timer
		 */
		'wait': function(options, editor, next, timer) {
			options = makeOptions(options, 'timeout', {
				timeout: 100
			});
			
			timer(next, parseInt(options.timeout, 10));
		},
		
		/**
		 * Move caret to a specified position
		 */
		'moveTo': function(options, editor, next, timer) {
			options = makeOptions(options, 'pos', {
				delay: 80,
				immediate: false // TODO: remove, use delay: 0 instead
			});
			
			if (!options.pos) {
				throw 'No position specified for "moveTo" action';
			}
			
			var curPos = editor.getCursor(true);
			// reset selection, if exists
			editor.setSelection(curPos, curPos);
			var targetPos = makePos(options.pos, editor);
			
			if (options.immediate || !options.delay) {
				editor.setCursor(targetPos);
				next();
			}
			
			var deltaLine = targetPos.line - curPos.line;
			var deltaChar = targetPos.ch - curPos.ch;
			var steps = Math.max(deltaChar, deltaLine);
			// var stepLine = deltaLine / steps;
			// var stepChar = deltaChar / steps;
			var stepLine = deltaLine < 0 ? -1 : 1;
			var stepChar = deltaChar < 0 ? -1 : 1;

			timer(function perform() {
				curPos = editor.getCursor(true);
				if (steps > 0 && !(curPos.line == targetPos.line && curPos.ch == targetPos.ch)) {

					if (curPos.line != targetPos.line) {
						curPos.line += stepLine;
					}

					if (curPos.ch != targetPos.ch) {
						curPos.ch += stepChar;
					}

					editor.setCursor(curPos);
					steps--;
					timer(perform, options.delay);
				} else {
					editor.setCursor(targetPos);
					next();
				}
			}, options.delay);
		},

		/**
		 * Similar to "moveTo" function but with immediate cursor position update
		 */
		'jumpTo': function(options, editor, next, timer) {
			options = makeOptions(options, 'pos', {
				afterDelay: 200
			});

			if (!options.pos) {
				throw 'No position specified for "jumpTo" action';
			}
			
			editor.setCursor(makePos(options.pos, editor));
			timer(next, options.afterDelay);
		},
		
		/**
		 * Executes predefined CodeMirror command
		 * @param {Object} options
		 * @param {CodeMirror} editor
		 * @param {Function} next
		 * @param {Function} timer
		 */
		'run': function(options, editor, next, timer) {
			options = makeOptions(options, 'command', {
				beforeDelay: 500,
				times: 1
			});
			
			var times = options.times;
			timer(function perform() {
				try {
					if (_.isFunction(options.command)) {
						options.command(editor, options);
					} else {
						editor.execCommand(options.command);	
					}
				} catch (e) {}
				if (--times > 0) {
					timer(perform, options.beforeDelay);
				} else {
					next();
				}
			}, options.beforeDelay);
		},
		
		/**
		 * Creates selection for specified position
		 * @param {Object} options
		 * @param {CodeMirror} editor
		 * @param {Function} next
		 * @param {Function} timer
		 */
		'select': function(options, editor, next, timer) {
			options = makeOptions(options, 'to', {
				from: 'caret'
			});
			
			var from = makePos(options.from, editor);
			var to = makePos(options.to, editor);
			editor.setSelection(from, to);
			next();
		}
	};
	
	/**
	 * Parses action call from string
	 * @param {String} data
	 * @returns {Object}
	 */
	function parseActionCall(data) {
		if (_.isString(data)) {
			var parts = data.split(':');
			return {
				name: parts.shift(),
				options: parts.join(':')
			};
		} else {
			var name = _.keys(data)[0];
			return {
				name: name,
				options: data[name]
			};
		}
	}
	
	function makeOptions(options, name, defaults) {
		if (_.isString(options)) {
			var o = {};
			o[name] = options;
			options = o;
		}
		
		return _.extend(defaults, options || {});
	}
	
	/**
	 * Helper function that produces <code>{line, ch}</code> object from
	 * passed argument
	 * @param {Object} pos
	 * @param {CodeMirror} editor
	 * @returns {Object}
	 */
	function makePos(pos, editor) {
		if (_.isString(pos)) {
			if (pos === 'caret') {
				return editor.getCursor(true);
			}
			
			if (~pos.indexOf(':')) {
				var parts = pos.split(':');
				return {
					line: parseInt(parts[0], 10),
					ch: parseInt(parts[1], 10)
				};
			}
			
			pos = parseInt(pos, 10);
		}
		
		if (_.isNumber(pos)) {
			return editor.posFromIndex(pos);
		}
		
		return pos;
	}
	
	function requestTimer(fn, delay) {
		if (!delay) {
			fn();
		} else {
			return setTimeout(fn, delay);
		}
	}
	
	// XXX add 'revert' action to CodeMirror to restore original text and position
	CodeMirror.commands.revert = function(editor) {
		if (editor.__initial) {
			editor.setValue(editor.__initial.content);
			editor.setCursor(editor.__initial.pos);
		}
	};
	
	
	/**
	 * @param {Object} actions Actions scenario
	 * @param {Object} data Initial content (<code>String</code>) or editor
	 * instance (<code>CodeMirror</code>)
	 */
	function Scenario(actions, data) {
		this._actions = actions;
		this._actionIx = 0;
		this._editor = null;
		this._state = STATE_IDLE;
		this._timerQueue = [];
		
		if (data && 'getValue' in data) {
			this._editor = data;
		}
		
		var ed = this._editor;
		if (ed && !ed.__initial) {
			ed.__initial = {
				content: ed.getValue(),
				pos: ed.getCursor(true)
			};
		}
	}
	
	Scenario.prototype = {
		_setup: function(editor) {
			if (!editor && this._editor) {
				editor = this._editor;
			}
			
			editor.execCommand('revert');
			return editor;
		},
		
		/**
		 * Play current scenario
		 * @param {CodeMirror} editor Editor instance where on which scenario 
		 * should be played
		 * @memberOf Scenario
		 */
		play: function(editor) {
			if (this._state === STATE_PLAY) {
				// already playing
				return;
			}
			
			if (this._state === STATE_PAUSE) {
				// revert from paused state
				editor = editor || this._editor;
				editor.focus();
				var timerObj = null;
				while (timerObj = this._timerQueue.shift()) {
					requestTimer(timerObj.fn, timerObj.delay);
				}
				
				this._state = STATE_PLAY;
				this.trigger('resume');
				return;
			}
			
			this._editor = editor = this._setup(editor);
			editor.focus();
			
			var timer = _.bind(this.requestTimer, this);
			var that = this;
			this._actionIx = 0;
			var next = function() {
				if (that._actionIx >= that._actions.length) {
					return timer(function() {
						that.stop();
					}, defaultOptions.afterDelay);
				}
				
				that.trigger('action', that._actionIx);
				var action = parseActionCall(that._actions[that._actionIx++]);
				
				if (action.name in actionsDefinition) {
					actionsDefinition[action.name].call(that, action.options, editor, next, timer);
				} else {
					throw 'No such action: ' + action.name;
				}
			};
			
			this._state = STATE_PLAY;
			this._editor.setOption('readOnly', true);
			this.trigger('play');
			timer(next, defaultOptions.beforeDelay);
		},
		
		/**
		 * Pause current scenario playback. It can be restored with 
		 * <code>play()</code> method call 
		 */
		pause: function() {
			this._state = STATE_PAUSE;
			this.trigger('pause');
		},
		
		/**
		 * Stops playback of current scenario
		 */
		stop: function() {
			if (this._state !== STATE_IDLE) {
				this._state = STATE_IDLE;
				this._timerQueue.length = 0;
				this._editor.setOption('readOnly', false);
				this.trigger('stop');
			}
		},
		
		/**
		 * Returns current playback state
		 * @return {String}
		 */
		state: function() {
			return this._state;
		},
		
		/**
		 * Toggle playback of movie scenario
		 */
		toggle: function() {
			if (this._state === STATE_PLAY) {
				this.pause();
			} else {
				this.play();
			}
		},
		
		requestTimer: function(fn, delay) {
			if (this._state !== STATE_PLAY) {
				// save function call into a queue till next 'play()' call
				this._timerQueue.push({
					fn: fn,
					delay: delay
				});
			} else {
				return requestTimer(fn, delay);
			}
		},
		
		// borrowed from Backbone
		/**
		 * Bind one or more space separated events, `events`, to a `callback`
		 * function. Passing `"all"` will bind the callback to all events fired.
		 * @param {String} events
		 * @param {Function} callback
		 * @param {Object} context
		 * @memberOf eventDispatcher
		 */
		on: function(events, callback, context) {
			var calls, event, node, tail, list;
			if (!callback) {
				return this;
			}
			
			events = events.split(eventSplitter);
			calls = this._callbacks || (this._callbacks = {});

			// Create an immutable callback list, allowing traversal during
			// modification.  The tail is an empty object that will always be used
			// as the next node.
			while (event = events.shift()) {
				list = calls[event];
				node = list ? list.tail : {};
				node.next = tail = {};
				node.context = context;
				node.callback = callback;
				calls[event] = {
					tail : tail,
					next : list ? list.next : node
				};
			}

			return this;
		},

		/**
		 * Remove one or many callbacks. If `context` is null, removes all
		 * callbacks with that function. If `callback` is null, removes all
		 * callbacks for the event. If `events` is null, removes all bound
		 * callbacks for all events.
		 * @param {String} events
		 * @param {Function} callback
		 * @param {Object} context
		 */
		off: function(events, callback, context) {
			var event, calls, node, tail, cb, ctx;

			// No events, or removing *all* events.
			if (!(calls = this._callbacks)) {
				return;
			}
			
			if (!(events || callback || context)) {
				delete this._callbacks;
				return this;
			}

			// Loop through the listed events and contexts, splicing them out of the
			// linked list of callbacks if appropriate.
			events = events ? events.split(eventSplitter) : _.keys(calls);
			while (event = events.shift()) {
				node = calls[event];
				delete calls[event];
				if (!node || !(callback || context)) {
					continue;
				}
				
				// Create a new list, omitting the indicated callbacks.
				tail = node.tail;
				while ((node = node.next) !== tail) {
					cb = node.callback;
					ctx = node.context;
					if ((callback && cb !== callback) || (context && ctx !== context)) {
						this.on(event, cb, ctx);
					}
				}
			}

			return this;
		},
		
		/**
		 * Trigger one or many events, firing all bound callbacks. Callbacks are
		 * passed the same arguments as `trigger` is, apart from the event name
		 * (unless you're listening on `"all"`, which will cause your callback
		 * to receive the true name of the event as the first argument).
		 * @param {String} events
		 */
		trigger: function(events) {
			var event, node, calls, tail, args, all, rest;
			if (!(calls = this._callbacks)) {
				return this;
			}
			
			all = calls.all;
			events = events.split(eventSplitter);
			rest = slice.call(arguments, 1);

			// For each event, walk through the linked list of callbacks twice,
			// first to trigger the event, then to trigger any `"all"` callbacks.
			while (event = events.shift()) {
				if (node = calls[event]) {
					tail = node.tail;
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, rest);
					}
				}
				if (node = all) {
					tail = node.tail;
					args = [ event ].concat(rest);
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, args);
					}
				}
			}

			return this;
		}
	};
	
	return _.extend(function(actions, data) {
		return new Scenario(actions, data);
	}, {
		defineAction: function(name, fn) {
			actionsDefinition[name] = fn;
		},
		makeOptions: makeOptions,
		makePos: makePos,
		has3d: has3d,
		prefixed: prefixed
	});
})();
/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
CodeMirror.scenarioTooltip = (function() {
	"use strict";
	var instance = null;
	var lastTween = null;
	var sc = CodeMirror.scenario;
	
	var alignDefaults = {
		/** CSS selector for getting popup tail */
		tailClass: 'CodeMirror-tooltip__tail',
		
		/** Class name for switching tail/popup position relative to target point */
		belowClass: 'CodeMirror-tooltip_below',
		
		/** Min distance between popup and viewport */
		popupMargin: 5,
		
		/** Min distance between popup left/right edge and its tail */
		tailMargin: 11
	};
	
	function getViewportRect() {
		var body = document.body;
		var docElem = document.documentElement;
		var clientTop = docElem.clientTop  || body.clientTop  || 0;
		var clientLeft = docElem.clientLeft || body.clientLeft || 0;
		var scrollTop  = window.pageYOffset || docElem.scrollTop  || body.scrollTop;
		var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
		
		return {
			top: scrollTop  - clientTop,
			left: scrollLeft - clientLeft,
			width: body.clientWidth || docElem.clientWidth,
			height: body.clientHeight || docElem.clientHeight
		};
	}
	
	/**
	 * Helper function that finds optimal position of tooltip popup on page
	 * and aligns popup tail with this position
	 * @param {Element} popup
	 * @param {Object} options
	 */
	function alignPopupWithTail(popup, options) {
		options = _.extend({}, alignDefaults, options || {});
		
		_.dom.css(popup, {
			left: 0,
			top: 0
		});
		
		var tail = _.dom.getByClass(options.tailClass, popup)[0];
		
		var resultX = 0, resultY = 0;
		var pos = options.position;
		var vp = getViewportRect();
		
		var width = popup.offsetWidth;
		var height = popup.offsetHeight;
		
		var isTop;
			
		// calculate horizontal position
		resultX = Math.min(vp.width - width - options.popupMargin, Math.max(options.popupMargin, pos.x - vp.left - width / 2));
		
		// calculate vertical position
		if (height + tail.offsetHeight + options.popupMargin + vp.top < pos.y) {
			// place above target position
			resultY = Math.max(0, pos.y - height - tail.offsetHeight);
			isTop = true;
		} else {
			// place below target position 
			resultY = pos.y + tail.offsetHeight;
			isTop = false;
		}
		
		// calculate tail position
		var tailMinLeft = options.tailMargin;
		var tailMaxLeft = width - options.tailMargin;
		tail.style.left = Math.min(tailMaxLeft, Math.max(tailMinLeft, pos.x - resultX - vp.left)) + 'px';
		
		_.dom.css(popup, {
			left: resultX,
			top: resultY
		});
		
		_.dom.toggleClass(popup, options.belowClass, isTop);
	}
	
	/**
	 * @param {jQuery} elem
	 * @param {Object} options 
	 */
	function animateShow(elem, options) {
		options = _.extend({}, alignDefaults, options || {});
		var cssOrigin = sc.prefixed('transformOrigin');
		var cssTransform = sc.prefixed('transform');
		var style = elem.style;

		var tail = _.dom.getByClass(options.tailClass, elem)[0];
		var xOrigin = _.dom.css(tail, 'left');
		var yOrigin = tail.offsetTop;
		if (_.dom.hasClass(elem, options.belowClass)) {
			yOrigin -= tail.offsetHeight;
		}
		
		yOrigin += 'px';

		style[cssOrigin] = xOrigin + ' ' + yOrigin;
		var prefix = sc.has3d ? 'translateZ(0) ' : '';
		
		return lastTween = new Tween({
			duration: 800,
			easing: 'easeOutElastic',
			step: function(pos) {
				style[cssTransform] = prefix + 'scale(' + pos + ')';
			},
			complete: function() {
				style[cssTransform] = 'none';
				lastTween = null;
				if (options.onComplete) {
					options.onComplete(elem);
				}
			}
		});
	}

	/**
	 * @param {jQuery} elem
	 * @param {Object} options
	 */
	function animateHide(elem, options) {
		var style = elem.style;

		return new Tween({
			duration: 200,
			easing: 'linear',
			step: function(pos) {
				style.opacity = (1 - pos);
			},
			complete: function() {
				_.dom.remove(elem);
				if (options.onComplete) {
					options.onComplete(elem);
				}
			}
		});
	}
	
	function showTooltip(text, pos, callback) {
		hideTooltip();
		
		instance = _.dom.toDOM('<div class="CodeMirror-tooltip">' +
			'<div class="CodeMirror-tooltip__content">' + text + '</div>' + 
			'<div class="CodeMirror-tooltip__tail"></div>' + 
			'</div>');
		
		_.dom.css(instance, sc.prefixed('transform'), 'scale(0)');
		document.body.appendChild(instance);
		
		alignPopupWithTail(instance, {position: pos});
		animateShow(instance, {onComplete: callback});
	}
	
	function hideTooltip(callback) {
		if (instance) {
			if (lastTween) {
				lastTween.stop();
				lastTween = null;
			}
			animateHide(instance, {onComplete: callback});
			instance = null;
		} else if (callback) {
			callback();
		}
	}
	
	// XXX extend CodeMirror scenario with new actions
	
	/**
	 * Resolves position where tooltip should point to
	 * @param {Object} pos
	 * @param {CodeMirror} editor
	 * @returns {Object} Object with <code>x</code> and <code>y</code> 
	 * properties
	 */
	function resolvePosition(pos, editor) {
		if (pos === 'caret') {
			// get absolute position of current caret position
			return sanitizeCaretPos(editor.cursorCoords(true));
		}

		if (_.isObject(pos)) {
			if ('x' in pos && 'y' in pos) {
				// passed absolute coordinates
				return pos;
			}

			if ('left' in pos && 'top' in pos) {
				// passed absolute coordinates
				return sanitizeCaretPos(pos);
			}
		}
		
		return sanitizeCaretPos(editor.charCoords(sc.makePos(pos)));
	}

	function sanitizeCaretPos(pos) {
		if ('left' in pos) {
			pos.x = pos.left;
		}

		if ('top' in pos) {
			pos.y = pos.top;
		}

		return pos;
	}
	
	/**
	 * Shows tooltip with specified text, wait for <code>options.wait</code>
	 * milliseconds then hides tooltip
	 */
	sc.defineAction('tooltip', function(options, editor, next, timer) {
		options = sc.makeOptions(options, 'text', {
			wait: 4000,   // time to wait before hiding tooltip
			pos: 'caret'  // position where tooltip should point to
		});
		
		var pos = resolvePosition(options.pos, editor);
		showTooltip(options.text, pos, function() {
			timer(function() {
				hideTooltip(function() {
					timer(next);
				});
			}, options.wait);
		});
	});
	
	/**
	 * Shows tooltip with specified text. This tooltip should be explicitly 
	 * hidden with <code>hideTooltip</code> action
	 */
	sc.defineAction('showTooltip', function(options, editor, next, timer) {
		options = sc.makeOptions(options, 'text', {
			pos: 'caret'  // position where tooltip should point to
		});
		
		showTooltip(options.text, resolvePosition(options.pos, editor));
		next();
	});
	
	/**
	 * Hides tooltip, previously shown by <code>showTooltip</code> action
	 */
	sc.defineAction('hideTooltip', function(options, editor, next, timer) {
		hideTooltip(next);
	});
	
	return {
		show: showTooltip,
		hide: hideTooltip
	};
})();

/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */
CodeMirror.scenarioOutline = (function() {
	"use strict";
	var defaultOptions = {
		wrapperTemplate: '<ul class="CodeMirror-outline"><%= content %></ul>',
		itemTemplate: '<li data-action-id="<%= id %>" class="CodeMirror-outline__item"><%= title %></li>',
		itemClass: 'CodeMirror-outline__item',
		selectedClass: 'CodeMirror-outline__item_selected'
	};
		
	/**
	 * @param {Object} hints
	 * @param {Scenario} scenario
	 * @param {Object} options
	 */
	return function(hints, scenario, options) {
		options = _.extend({}, defaultOptions, options || {});
		
		var hintKeys = _.keys(hints);
		hintKeys.sort(function(a, b) {
			return parseInt(a, 10) - parseInt(b, 10);
		});
		
		var itemTemplate = _.template(options.itemTemplate);
		var items = _.map(hintKeys, function(key) {
			return itemTemplate({
				title: hints[key],
				id: key
			});
		});
		
		var el = _.dom.toDOM(_.template(options.wrapperTemplate, {
			content: items.join('')
		}));
		
		if (options.target) {
			options.target.appendChild(el);
		}
		
		scenario
			.on('action', function(id) {
				var items = _.dom.getByClass(options.itemClass, el);
				var matchedItem = _.find(items, function(elem) {
					return elem.getAttribute('data-action-id') == id;
				});
				
				if (matchedItem) {
					_.dom.removeClass(items, options.selectedClass);
					_.dom.addClass(matchedItem, options.selectedClass);
				}
			})
			.on('stop', function() {
				_.dom.removeClass(_.dom.getByClass(options.itemClass, el), options.selectedClass);
			});
		
		return el;
	};
})();
/**
 * Shows fake prompt dialog with interactive value typing
 */
CodeMirror.scenarioPrompt = (function() {
	"use strict";
	var dialogInstance = null;
	var bgInstance = null;
	var lastTween = null;
	
	var sc = CodeMirror.scenario;
	
	function showPrompt(text, target, callback) {
		hidePrompt();
		dialogInstance = _.dom.toDOM('<div class="CodeMirror-prompt">' +
			'<div class="CodeMirror-prompt__title">' + text + '</div>' + 
			'<input type="text" name="prompt" class="CodeMirror-prompt__input" readonly="readonly" />' + 
			'</div>');
		bgInstance = _.dom.toDOM('<div class="CodeMirror-prompt__shade"></div>');
		
		target.appendChild(dialogInstance);
		target.appendChild(bgInstance);
		
		animateShow(dialogInstance, bgInstance, {onComplete: callback});
	}
	
	function hidePrompt(callback) {
		if (dialogInstance) {
			if (lastTween) {
				lastTween.stop();
				lastTween = null;
			}
			animateHide(dialogInstance, bgInstance, {onComplete: callback});
			dialogInstance = bgInstance = null;
		} else if (callback) {
			callback();
		}
	}
	
	/**
	 * @param {Element} dialog
	 * @param {Element} bg
	 * @param {Object} options 
	 */
	function animateShow(dialog, bg, options) {
		options = options || {};
		var cssTransform = sc.prefixed('transform');
		var dialogStyle = dialog.style;
		var bgStyle = bg.style;
		var height = dialog.offsetHeight;
		var tmpl = _.template(sc.has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

		bgStyle.opacity = 0;
		new Tween({
			duration: 200,
			step: function(pos) {
				bgStyle.opacity = pos;
			}
		});
		
		dialogStyle[cssTransform] = tmpl({pos: -height});
		
		return lastTween = new Tween({
			duration: 400,
			easing: 'easeOutCubic',
			step: function(pos) {
				dialogStyle[cssTransform] = tmpl({pos: (-height * (1 - pos)) + 'px'});
			},
			complete: function() {
				lastTween = null;
				if (options.onComplete) {
					options.onComplete(dialog, bg);
				}
			}
		});
	}

	/**
	 * @param {Element} dialog
	 * @param {Element} bg
	 * @param {Object} options
	 */
	function animateHide(dialog, bg, options) {
		var dialogStyle = dialog.style;
		var bgStyle = bg.style;
		var height = dialog.offsetHeight;
		var cssTransform = sc.prefixed('transform');
		var tmpl = _.template(sc.has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

		return new Tween({
			duration: 200,
			step: function(pos) {
				dialogStyle[cssTransform] = tmpl({pos: (-height * pos) + 'px'});
				bgStyle.opacity = 1 - pos;
			},
			complete: function() {
				_.dom.remove([dialog, bg]);
				if (options.onComplete) {
					options.onComplete(dialog, bg);
				}
			}
		});
	}
	
	function typeText(target, options, timer, next) {
		var chars = options.text.split('');
		timer(function perform() {
			target.value += chars.shift();
			if (chars.length) {
				timer(perform, options.delay);
			} else {
				next();
			}
		}, options.delay);
	}
	
	// XXX extend CodeMirror scenario with new actions
	sc.defineAction('prompt', function(options, editor, next, timer) {
		options = sc.makeOptions(options, 'text', {
			title: 'Enter something',
			delay: 80,        // delay between character typing
			typeDelay: 1000,  // time to wait before typing text
			hideDelay: 2000   // time to wait before hiding prompt dialog
		});
		
		showPrompt(options.title, editor.getWrapperElement(), function(dialog) {
			timer(function() {
				typeText(_.dom.getByClass('CodeMirror-prompt__input', dialog)[0], options, timer, function() {
					timer(function() {
						hidePrompt(next);
					}, options.hideDelay);
				});
			}, options.typeDelay);
		});
	});
})();
/**
 * A high-level library interface for creating scenarios over textarea
 * element. The <code>CodeMirror.movie</code> takes reference to textarea
 * element (or its ID) and parses its content for initial content value,
 * scenario and outline.
 * @constructor
 * @memberOf __movie  
 */
(function() {
	"use strict";
	var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
	var mac = ios || /Mac/.test(navigator.platform);

	var macCharMap = {
		'ctrl': '⌃',
		'control': '⌃',
		'cmd': '⌘',
		'shift': '⇧',
		'alt': '⌥',
		'enter': '⏎',
		'tab': '⇥',
		'left': '←',
		'right': '→',
		'up': '↑',
		'down': '↓'
	};
		
	var pcCharMap = {
		'cmd': 'Ctrl',
		'control': 'Ctrl',
		'ctrl': 'Ctrl',
		'alt': 'Alt',
		'shift': 'Shift',
		'left': '←',
		'right': '→',
		'up': '↑',
		'down': '↓'
	};
	
	var defaultOptions = {
		/**
		 * Automatically parse movie definition from textarea content. Setting
		 * this property to <code>false</code> assumes that user wants to
		 * explicitly provide movie data: initial value, scenario etc.
		 */
		parse: true,
		
		/**
		 * String or regexp used to separate sections of movie definition, e.g.
		 * default value, scenario and editor options
		 */
		sectionSeparator: '@@@',
		
		/** Regular expression to extract outline from scenario line */
		outlineSeparator: /\s+:::\s+(.+)$/,
		
		/** Automatically prettify keyboard shortcuts in outline */
		prettifyKeys: true,
		
		/** Strip parentheses from prettyfied keyboard shortcut definition */
		stripParentheses: false
	};
	
	/**
	 * Prettyfies key bindings references in given string: formats it according
	 * to current user’s platform. The key binding should be defined inside 
	 * parentheses, e.g. <code>(ctrl-alt-up)</code>
	 * @param {String} str
	 * @param {Object} options Transform options
	 * @returns {String}
	 */
	function prettifyKeyBindings(str, options) {
		options = options || {};
		var reKey = /ctrl|alt|shift|cmd/i;
		var map = mac ? macCharMap : pcCharMap;
		return str.replace(/\((.+?)\)/g, function(m, kb) {
			if (reKey.test(kb)) {
				var parts = _.map(kb.toLowerCase().split(/[\-\+]/), function(key) {
					return map[key.toLowerCase()] || key.toUpperCase();
				});
				
				m = parts.join(mac ? '' : '+');
				if (!options.stripParentheses) {
					m = '(' + m + ')';
				}
			}
			
			return m;
		});
	}
	
	/**
	 * Relaxed JSON parser.
	 * @param {String} text
	 * @returns {Object} 
	 */
	function parseJSON(text) {
		try {
			return (new Function('return ' + text))();
		} catch(e) {
			return {};
		}
	}
	
	function readLines(text) {
		// IE fails to split string by regexp, 
		// need to normalize newlines first
		var nl = '\n';
		var lines = (text || '')
			.replace(/\r\n/g, nl)
			.replace(/\n\r/g, nl)
			.replace(/\r/g, nl)
			.split(nl);

		return _.filter(lines, function(line) {
			return !!line;
		});
	}
	
	function unescape(text) {
		var replacements = {
			'&lt;':  '<',
			'&gt;':  '>',
			'&amp;': '&'
		};

		return text.replace(/&(lt|gt|amp);/g, function(str, p1) {
			return replacements[str] || str;
		});
	}
	
	/**
	 * Extracts initial content, scenario and outline from given string
	 * @param {String} text
	 * @param {Object} options
	 */
	function parseMovieDefinition(text, options) {
		options = _.extend({}, defaultOptions, options || {});
		var parts = text.split(options.sectionSeparator);

		// parse scenario
		var reDef = /^(\w+)\s*:\s*(.+)$/;
		var scenario = [];
		var outline = {};
		var editorOptions = {};

		// read movie definition
		_.each(readLines(parts[1]), function(line) {
			if (line.charAt(0) == '#'){
				// it’s a comment, skip the line	
				return;
			}

			// do we have outline definition here?
			line = line.replace(options.outlineSeparator, function(str, title) {
				if (options.prettifyKeys) {
					outline[scenario.length] = prettifyKeyBindings(_.dom.trim(title));
				}
				return '';
			});

			var sd = line.match(reDef);
			if (!sd) {
				return scenario.push(_.dom.trim(line));
			}
				

			if (sd[2].charAt(0) == '{') {
				var obj = {};
				obj[sd[1]] = parseJSON(unescape(sd[2]));
				return scenario.push(obj);
			}

			scenario.push(sd[1] + ':' + unescape(sd[2]));
		});

		// read editor options
		if (parts[2]) {
			_.each(readLines(parts[2]), function(line) {
				if (line.charAt(0) == '#'){
					// it’s a comment, skip the line
					return;
				}

				var sd = line.match(reDef);
				if (sd) {
					editorOptions[sd[1]] = sd[2];
				}
			});
		}

		return {
			value: unescape(_.dom.trim(parts[0])),
			scenario: scenario,
			outline: _.keys(outline).length ? outline : null,
			editorOptions: editorOptions
		};
	}
	
	/**
	 * Hich-level function to create movie instance on textarea.
	 * @param {Element} target Reference to textarea, either <code>Element</code>
	 * or string ID
	 * @param {Object} movieOptions Movie options. See <code>defaultOptions</code>
	 * for value reference
	 * @param {Object} editorOptions Additional options passed to CodeMirror
	 * editor initializer.
	 */
	CodeMirror.movie = function(target, movieOptions, editorOptions) {
		var hlLine = null;

		if (_.isString(target)) {
			target = document.getElementById(target);
		}
		
		movieOptions = _.extend({}, defaultOptions, movieOptions || {});
		
		editorOptions = _.extend({
			theme: 'espresso',
			mode : 'text/html',
			indentWithTabs: true,
			tabSize: 4,
			lineNumbers : true,
			onCursorActivity: function() {
				if (editor.setLineClass) {
					editor.setLineClass(hlLine, null, null);
					hlLine = editor.setLineClass(editor.getCursor().line, null, 'activeline');
				}
			},
			onKeyEvent: function(ed, evt) {
				if (ed.getOption('readOnly')) {
					evt.stop();
					return true;
				}
			}
		}, editorOptions || {});
		
		var initialValue = editorOptions.value || target.value || '';
		
		if (movieOptions.parse) {
			_.extend(movieOptions, parseMovieDefinition(initialValue, movieOptions));
			initialValue = movieOptions.value;
			if (movieOptions.editorOptions) {
				_.extend(editorOptions, movieOptions.editorOptions);
			}

			// read CM options from given textarea
			var cmAttr = /^data\-cm\-(.+)$/i;
			_.each(target.attributes, function(attr) {
				if (cmAttr.test(attr.name)) {
					editorOptions[RegExp.$1] = attr.value;
				}
			});
		}
		
		// normalize line endings
		initialValue = initialValue.replace(/\r?\n/g, '\n');
		
		// locate initial caret position from | symbol
		var initialPos = initialValue.indexOf('|');
		target.value = editorOptions.value = initialValue = initialValue.replace(/\|/g, '');
		
		// create editor instance
		var editor = CodeMirror.fromTextArea(target, editorOptions);
		if (editor.setLineClass) {
			hlLine = editor.setLineClass(0, 'activeline');
		}
		
		if (initialPos != -1) {
			editor.setCursor(editor.posFromIndex(initialPos));
		}
		
		// save initial data so we can revert to it later
		editor.__initial = {
			content: initialValue,
			pos: editor.getCursor(true)
		};
		
		var wrapper = editor.getWrapperElement();
		
		// adjust height, if required
		if (editorOptions.height) {
			wrapper.style.height = editorOptions.height + 'px';
		}
		
		
		wrapper.className += ' CodeMirror-movie' + (movieOptions.outline ? ' CodeMirror-movie_with-outline' : '');
		
		var sc = CodeMirror.scenario(movieOptions.scenario, editor);
		if (movieOptions.outline) {
			wrapper.className += ' CodeMirror-movie_with-outline';
			wrapper.appendChild(CodeMirror.scenarioOutline(movieOptions.outline, sc));
		}
		return sc;
	};
})();