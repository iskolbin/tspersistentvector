Persistent Vector
=================

Functions
=========

Make
----

`Vector.make<T>( arraylike?: T[] ): Vector.Data<T>`

`Vector.of<T>( ...args: T[] ): Vector.Data<T>`

`Vector.repeat<T>( value: T, count: number ): Vector.Data<T>`

`Vector.range( start: number, finish?: number, step?: number ): Vector.Data<number>`

`Vector.clone( vec: Vector.Data<T> ): Vector.Data<T>`

`Vector.ofTransient<T>( t: TransientVector<T> ): Vector.Data<T>`


To JS
-----

`Vector.toArray<T>( vec: Vector.Data<T> ): T[]`


Get
---

`Vector.get<T>( vec: Vector.Data<T> ): T | undefined`

`Vector.first<T>( vec: Vector.Data<T> ): T | undefined`

`Vector.last<T>( vec: Vector.Data<T> ): T | undefined`


Set
---

`Vector.set<T>( vec: Vector.Data<T>, index: number, value: T ): Vector.Data<T>`

`Vector.update<T,K>( vec: Vector.Data<T>, index: number, (oldValue: T, index: number, arg: K) => T, arg: K = vec ): Vector.Data<T>` 


Insert
------

`Vector.insert<T>( vec: Vector.Data<T>, index: number, ...values: T[] ): Vector.Data<T>`

`Vector.push<T>( vec: Vector.Data<T>, ...values: T[] ): Vector.Data<T>`


Remove
------

`Vector.remove<T>( vec: Vector.Data<T>, index: number, count: number = 1 ): Vector.Data<T>`

`Vector.pop<T>( vec: Vector.Data<T>, count: number = 1 ): Vector.Data<T>`

`Vector.clear<T>( vec: Vector.Data<T> ): Vector.Data<T>`


Find
----

`Vector.indexOf<T>( vec: Vector.Data<T>, value: T ): number`

`Vector.lastIndexOf<T>( vec: Vector.Data<T>, value: T ): number`

`Vector.find<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): T | undefined`

`Vector.findLast<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): T | undefined`

`Vector.findIndex<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): T | undefined`

`Vector.findLastIndex<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): T | undefined`


Folds
-----

`Vector.reduce<T,A,Y>( vec: Vector.Data<T>, callbackFn: ( accumulator: A, value: T, index: number, arg: Y ) => A, accumulator: A = Vector.first( vec ), arg: Y = vec ): T`

`Vector.reduceRight<T,A,Y>( vec: Vector.Data<T>, callbackFn: ( accumulator: A, value: T, index: number, arg: Y ) => A, accumulator: A = Vector.first( vec ), arg: Y = vec ): T`

`Vector.sum<T>( vec: Vector.Data<T> ): T`

`Vector.every<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): boolean`

`Vector.some<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): boolean`

`Vector.join<T>( vec: Vector.Data<T>, separator: string = ',' ): string`

`Vector.toString<T>( vec: Vector.Data<T> ): string`


Slice & splice
--------------

`Vector.slice<T>( vec: Vector.Data<T>, start: number = 0, end: number = vec.size ): Vector.Data<T>`

`Vector.splice<T>( vec: Vector.Data<T>, start: number, deleteCount: number = vec.size-start, ...values: T[] ): Vector.Data<T>`


Map
---

`Vector.map<T,U,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => U, thisArg?: Z, arg: Y = vec ): Vector.Data<T>`


Filter
------

`Vector.filter<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): Vector.Data<T>`

`Vector.reject<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): Vector.Data<T>`


Additional transforms
---------------------

`Vector.sort<T>( vec: Vector.Data<T>, compareFn: (a: T, b: T) => number ): Vector.Data<T>`

`Vector.reverse<T>( vec: Vector.Data<T> ): Vector.Data<T>`

`Vector.concat<T>( ...vectors: Vector.Data<T> ): Vector.Data<T>`


Helpers
-------

`Vector.isEmpty<T>( vec: Vector.Data<T> ): boolean`

`Vector.includes<T>( vec: Vector.Data<T>, value: T ): boolean`

`Vector.count<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => boolean, thisArg?: Z, arg: Y = vec ): number`

`Vector.forEach<T,Z,Y>( vec: Vector.Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: Y ) => void, thisArg?: Z, arg: Y = vec ): void`

`Vector.iterator<T>( vec: Vector.Data<T> ): VectorIterator<T>`
