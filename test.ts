import * as Vector from './src/Vector'
import { TransientVector } from './src/TransientVector'
import { suite, test, slow, timeout } from "mocha-typescript"
import { assert, deepEqual, throws } from "assert"

@suite class VectorSuite {
	@test("make without arg")
	makeNone() {
		deepEqual( Vector.make(), {
			kind: "PersistentVector",
			size: 0,
			shift: 0,
			root: undefined,
			tail: []
		})
	}

	@test("make with []")
	make0() {
		deepEqual( Vector.make( [] ), {
			kind: "PersistentVector",
			size: 0,
			shift: 0,
			root: undefined,
			tail: []
		})
	}
	
	@test("make with [1,2,3]")
	make3() {
		deepEqual( Vector.make([1,2,3]), {
			kind: "PersistentVector",
			size: 3,
			shift: 0,
			root: undefined,
			tail: [1,2,3]
		})
	}

	@test("constructor without args") 
	constrNo() {
		deepEqual( new Vector.Vector<any>().data, Vector.make( [] ))
	}

	@test("constructor with []")
	constr0() {
		deepEqual( new Vector.Vector<any>([]).data, Vector.make( [] ))
	}

	@test("constructor with [1,2,3]")
	constr123() {
		deepEqual( new Vector.Vector([1,2,3]).data, Vector.make( [1,2,3] ))
	}

	@test("make with [1,2,3...,33] (33 elements)")
	make33() {
		deepEqual( Vector.make([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]), {
			kind: "PersistentVector",
			size: 33,
			shift: 0,
			root: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
			tail: [33]
		})
	}

	@test("make with [1,2,3...,67] (67 elements)")
	make67() {
		deepEqual( Vector.make([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]),
			{ 
				kind: "PersistentVector",
				size: 67,
				shift: 5,
				root: [
					[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
					[33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
					
				].concat( new Array(30)),
				tail: [65,66,67]
			})
	}

	@test("of with (1,2,3...,33) (33 elements)")
	of33() {
		deepEqual( Vector.of(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33), {
			kind: "PersistentVector",
			size: 33,
			shift: 0,
			root: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
			tail: [33]
		})
	}

	@test("repeat with (10,33)")
	repeat33() {
		deepEqual( Vector.repeat( 1, 33 ), {
			kind: "PersistentVector",
			size: 33,
			shift: 0,
			root: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
			tail: [1]
		})
		deepEqual( Vector.Vector.repeat( 1, 33 ).data, Vector.repeat( 1, 33 ))
	}

	@test("range(33)")
	range33() {
		deepEqual( Vector.range( 33 ), Vector.of(
			0,
			1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
			17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
		))
	}

	@test("range(10,43)")
	range10to43() {
		deepEqual( Vector.range( 10, 43 ), Vector.of(
			10,
			11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,
			27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,
		))
	}

	@test("range(43,10)")
	range43to10() {
		deepEqual( Vector.range( 43, 10 ), Vector.of(
			43,
			42,41,40,39,38,37,36,35,34,33,32,31,30,29,28,27,
			26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11
		))
	}

	@test("range(43,10,-2)")
	range43to10by_2() {
		deepEqual( Vector.range( 43, 10, -2 ), Vector.of(
			43,
			41,39,37,35,33,31,29,27,
			25,23,21,19,17,15,13,11
		))
	}

	@test("range(43,10,4)")
	range43to10by4() {
		deepEqual( Vector.range( 43, 10, 4 ), Vector.of())
		deepEqual( Vector.Vector.range( 43, 10, 4 ), Vector.Vector.of())
	}

	@test("clone")
	clone() {
		const v = Vector.range( 10, 40 )
		deepEqual( v != Vector.clone( v ), true )
		deepEqual( v, Vector.clone( v ))
	}

	@test("clear")
	clear() {
		deepEqual( Vector.clear( Vector.range( 10 )), Vector.make())	
		deepEqual( Vector.Vector.range( 10 ).clear(), Vector.Vector.of())	
	}

	@test("last")
	last() {
		deepEqual( Vector.last( Vector.range( 67 )), 66 )	
		deepEqual( Vector.Vector.range( 67 ).last(), 66 )	
	}
	
	@test("first")
	first() {
		deepEqual( Vector.first( Vector.range( 10,77 )), 10 )	
		deepEqual( Vector.Vector.range( 10,77 ).first(), 10 )	
	}

	@test("isEmpty")
	isEmpty() {
		deepEqual( Vector.isEmpty( Vector.make()), true )
		deepEqual( Vector.isEmpty( Vector.make([1,2,3])), false )
		deepEqual( Vector.isEmpty( Vector.clear( Vector.of(1,2,3,4) )), true )
		deepEqual( new Vector.Vector().isEmpty(), true )
		deepEqual( new Vector.Vector([1,2,3]).isEmpty(), false )
		deepEqual( Vector.Vector.of(1,2,3,4).clear().isEmpty(), true )
	}

	@test("push 1 to empty")
	pushToEmpty() {
		deepEqual( Vector.push( Vector.of(), 1 ), Vector.of( 1 ))
		deepEqual( Vector.Vector.of().push( 1 ), Vector.Vector.of( 1 ))
	}

	@test("push 31 to range(31)")
	pushToRange31() {
		deepEqual( Vector.push( Vector.range(31), 31 ), Vector.range(32) )
	}

	@test("push 32 to range(32)")
	pushToRange32() {
		deepEqual( Vector.push( Vector.range(32), 32 ), Vector.range(33) )
		deepEqual( Vector.Vector.range(32).push(32), Vector.Vector.range(33) )
	}

	@test("push 63 to range(63)")
	pushToRange63() {
		deepEqual( Vector.push( Vector.range(63), 63 ), Vector.range(64) )
		deepEqual( Vector.Vector.range(63).push( 63 ), Vector.Vector.range(64) )
	}

	@test("push 65,66,67 to range(64)")
	pushToRange64() {
		deepEqual( Vector.push( Vector.range(64), 64,65,66 ), Vector.range(67) )
		deepEqual( Vector.Vector.range(64).push( 64,65,66 ), Vector.Vector.range(67) )
	}

	@test("push 1023,1024 to range(1023)")
	pushToRange1024() {
		deepEqual( Vector.push( Vector.range(1023), 1023,1024 ), Vector.range(1025) )
		deepEqual( Vector.Vector.range(1023).push( 1023,1024 ), Vector.Vector.range(1025) )
	}

	@test("get from empty")
	getFromEmpty() {
		deepEqual( Vector.get( Vector.of(), 0 ), undefined )
		deepEqual( Vector.Vector.of().get( 0 ), undefined )
	}

	@test("get from range(31,32,33,63,64,65,128,1023,1024,1025,3333)")
	getFromRange32() {
		for ( const n of [31,32,33,63,64,65,128,1023,1024,1025,3333] ) {
			const v = Vector.range(n)
			const vec = Vector.Vector.range(n)
			for ( let i = 0; i < n; i++ ) {
				deepEqual( Vector.get( v, i ), i )
				deepEqual( vec.get( i ), i )
			}
		}
	}

	@test("set to empty")
	setEmpty() {
		deepEqual( Vector.set( Vector.of(), 1, 1 ), Vector.of())
	}

	@test("set to range(16)")
	setRange16() {
		deepEqual( Vector.set( Vector.range(16), 7, -7 ), Vector.of(0,1,2,3,4,5,6,-7,8,9,10,11,12,13,14,15))
	}

	@test("set to range(31,32,63,64,1025,1057,2500)")
	setRange32() {
		for ( const n of [31,32,63,64,1025,1057,2500] ) {
			let v = Vector.range(n)
			let v2 = Vector.Vector.range(n)
			for ( let i = 0; i < n; i++ ) {
				v = Vector.set( v, i, i !== 0 ? -i : i )
				v2 = v2.set( i, i !== 0 ? -i : i )
			}
			const range = Vector.range( -n )
			deepEqual( v, range )
			deepEqual( v2.data, range )
		}
	}

	@test("update out of range")
	updateOut() {
		deepEqual( Vector.update( Vector.range(16), 32, v => v + 1 ), Vector.range(16))
	}
	
	@test("update range(16)")
	updateRange16() {
		deepEqual( Vector.update( Vector.range(16), 7, v => -v ), Vector.of(0,1,2,3,4,5,6,-7,8,9,10,11,12,13,14,15))
		deepEqual( Vector.Vector.range(16).update( 7, v => -v ).data, Vector.of(0,1,2,3,4,5,6,-7,8,9,10,11,12,13,14,15))
	}

	@test("size of Vector instance range(16,31,32,33,63,64,64,1023,1024,1025,3000)")
	size() {
		for ( const n of [16,31,32,33,63,64,64,1023,1024,1025,300016,31,32,33,63,64,64,1023,1024,1025,3000] ){
			deepEqual( Vector.Vector.range(n).size, n )
		}
	}
	
	@test("pop empty")
	popEmpty() {
		deepEqual( Vector.pop( Vector.of( 1 )), Vector.of())
		deepEqual( Vector.pop( Vector.of()), Vector.of())
		deepEqual( Vector.Vector.of().pop().data, Vector.of())
	}

	@test("pop range(16,31,32,33,63,64,64,1023,1024,1025,3000) default count")
	popRanges16() {
		for ( const n of [16,31,32,33,63,64,64,1023,1024,1025,300]) {
			deepEqual( Vector.pop( Vector.range(n)), Vector.range( n-1 ))
			deepEqual( Vector.Vector.range( n ).pop( 5 ).data, Vector.range( n - 5 )) 
		}
	}

	@test("pop range(16,31,32,33,63,64,64,1023,1024,1025,3000) for counts 1, 2, 10")
	popRangesCounts() {
		for ( const n of [16,31,32,33,63,64,64,1023,1024,1025,300]) {
			for ( const popCount of [1,2,10] ) {
				deepEqual( Vector.pop( Vector.range(n), popCount ), Vector.range( n-popCount ))
			}
		}
	}

	@test("toArray 16,31,32,33,63,64,65,1023,1024,1025,2845")
	toArray() {
		for ( const n of [16,31,32,33,63,64,64,1023,1024,1025,2845]) {
			const range = []
			for ( let i = 0; i < n; i++ ) {
				range[i] = i
			}
			deepEqual( Vector.toArray( Vector.range(n)), range )
		}
	}

	@test("forEach")
	forEach() {
		const array = []
		const array2 = []
		const range = []
		const range2 = []
		for ( let i = 0; i < 2883; i++ ) {
			range[i] = i
			range2[i] = i
		}
		Vector.forEach( Vector.range(2883), v => array.push(v))
		Vector.Vector.range( 2883 ).forEach( v => array2.push(v))
		deepEqual( array, range )
		deepEqual( Vector.make( range ), Vector.range( 2883 ))
		deepEqual( array2, range2 )
	}

	@test("reduce")
	reduce() {
		deepEqual( Vector.reduce( Vector.repeat( 1, 100 ), (acc,v) => acc + v ), 100 )
		deepEqual( Vector.reduce( Vector.repeat( 1, 100 ), (acc,v) => acc + v, 50 ), 150 )
		deepEqual( Vector.reduce( Vector.range(16), (acc,v) => acc.concat([v]), [-1]), [-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
		deepEqual( Vector.Vector.range(16).reduce((acc,v) => acc.concat([v]), [-1]), [-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
	}

	@test("reduceRight")
	reduceRight() {
		deepEqual( Vector.reduceRight( Vector.repeat( 1, 100 ), (acc,v) => acc + v ), 100 )
		deepEqual( Vector.reduceRight( Vector.repeat( 1, 100 ), (acc,v) => acc + v, 50 ), 150 )
		deepEqual( Vector.reduceRight( Vector.range( 100 ), (acc,v) => acc.concat([v]), [] as number[] ), Vector.toArray( Vector.range(100)).reverse())
		deepEqual( Vector.Vector.range( 100 ).reduceRight((acc,v) => acc.concat([v]), [] as number[] ), Vector.toArray( Vector.range(100)).reverse())
	}

	@test("finished iterator")
	finishedIterator() {
		const iter = Vector.iterator( Vector.range(10))
		const iter2 = Vector.Vector.range(10).iterator()
		for ( let i = 0; i < 10; i++ ) {
			iter.getNext()
			iter2.getNext()
		}
		try {
			iter.getNext()
			iter2.getNext()
			deepEqual( false, true )
		} catch (e) {
			deepEqual( true, true )
		}
	}

	@test("iteration")
	iteration() {
		const x = []
		for ( const v of { [Symbol.iterator]: () => Vector.iterator( Vector.range(16))}) {
			x.push( v )
		}
		deepEqual( x, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] )
		const y = []
		for ( const v of Vector.Vector.range(16)) {
			y.push( v )
		}
		deepEqual( y, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] )
	}

	@test("sum")
	sum() {
		deepEqual( Vector.sum( Vector.repeat( 10, 0)), 0 )
		deepEqual( Vector.sum( Vector.repeat( 10, 10 )), 100 )
	}

	@test("reverse")
	reverse() {
		deepEqual( Vector.range( 100 ), Vector.reverse( Vector.range( 99, -1 )))
		deepEqual( Vector.Vector.range( 100 ), Vector.Vector.range( 99, -1 ).reverse())
	}

	@test("map")
	map() {
		let arr = []
		for ( let i = 0; i < 130; i++ ) arr[i] = i * i
		deepEqual( Vector.map( Vector.range( 130 ), v => v * v ), Vector.make( arr ))
		deepEqual( Vector.Vector.range( 130 ).map( v => v * v ).toArray(), arr )
	}

	@test("filter")
	filter() {
		deepEqual( Vector.filter( Vector.range( 1500 ), v => v < 750 ), Vector.range( 750 ))
		deepEqual( Vector.Vector.range( 1500 ).filter( v => v < 750 ), Vector.Vector.range( 750 ))
	}
	
	@test("reject")
	reject() {
		deepEqual( Vector.reject( Vector.range( 1500 ), v => v < 750 ), Vector.range( 750, 1500 ))
		deepEqual( Vector.Vector.range( 1500 ).reject( v => v < 750 ), Vector.Vector.range( 750, 1500 ))
		deepEqual( Vector.Vector.range( 1500 ).filterNot( v => v < 750 ), Vector.Vector.range( 750, 1500 ))
	}

	@test("indexOf")
	indexOf() {
		deepEqual( Vector.indexOf( Vector.range( 1000 ), 500 ), 500 )
		deepEqual( Vector.indexOf( Vector.repeat( 0, 1000 ), 0 ), 0 )
		deepEqual( Vector.indexOf( Vector.repeat( 0, 1000 ), 1 ), -1 )
		deepEqual( Vector.Vector.range( 1000 ).indexOf( 500 ), 500 )
		deepEqual( Vector.Vector.repeat( 0, 1000 ).indexOf( 0 ), 0 )
		deepEqual( Vector.Vector.repeat( 0, 1000 ).indexOf( 1 ), -1 )
	}
	
	@test("lastIndexOf")
	lastIndexOf() {
		deepEqual( Vector.lastIndexOf( Vector.range( 1000 ), 500 ), 500 )
		deepEqual( Vector.lastIndexOf( Vector.repeat( 0, 1000 ), 0 ), 999 )
		deepEqual( Vector.indexOf( Vector.repeat( 0, 1000 ), 1 ), -1 )
		deepEqual( Vector.Vector.range( 1000 ).lastIndexOf( 500 ), 500 )
		deepEqual( Vector.Vector.repeat( 0, 1000 ).lastIndexOf( 0 ), 999 )
		deepEqual( Vector.Vector.repeat( 0, 1000 ).lastIndexOf( 1 ), -1 )
	}

	@test("find")
	find() {
		deepEqual( Vector.find( Vector.range( 1000 ), i => i > 500 ), 501 )
		deepEqual( Vector.find( Vector.range( 1000 ), i => i > 1500 ), undefined )
		deepEqual( Vector.Vector.range(1000).find( i => i > 500 ), 501 )
		deepEqual( Vector.Vector.range(1000).find( i => i > 1500 ), undefined )
	}

	@test("findLast")
	findLast() {
		deepEqual( Vector.findLast( Vector.range( 1000 ), i => i > 500 ), 999 )
		deepEqual( Vector.findLast( Vector.range( 1000 ), i => i > 1500 ), undefined )
		deepEqual( Vector.Vector.range(1000).findLast( i => i > 500 ), 999 )
		deepEqual( Vector.Vector.range(1000).findLast( i => i > 1500 ), undefined )
	}
	
	@test("findIndex")
	findIndex() {
		deepEqual( Vector.findIndex( Vector.range( 1000 ), i => i > 500 ), 501 )
		deepEqual( Vector.findIndex( Vector.range( 1000 ), i => i > 1500 ), -1 )
		deepEqual( Vector.Vector.range(1000).findIndex( i => i > 500 ), 501 )
		deepEqual( Vector.Vector.range(1000).findIndex( i => i > 1500 ), -1 )
	}

	@test("findLastIndex")
	findLastIndex() {
		deepEqual( Vector.findLastIndex( Vector.range( 1000 ), i => i > 500 ), 999 )
		deepEqual( Vector.findLastIndex( Vector.range( 1000 ), i => i > 1500 ), -1 )
		deepEqual( Vector.Vector.range(1000).findLastIndex( i => i > 500 ), 999 )
		deepEqual( Vector.Vector.range(1000).findLastIndex( i => i > 1500 ), -1 )
	}
	
	@test("includes")
	includes() {
		deepEqual( Vector.includes( Vector.range( 1060 ), 514 ), true )
		deepEqual( Vector.includes( Vector.range( 1060 ), 1514 ), false )
		deepEqual( Vector.Vector.range( 1060 ).includes( 514 ), true )
		deepEqual( Vector.Vector.range( 1060 ).includes( 1514 ), false )
	}

	@test("some")
	some() {
		deepEqual( Vector.some( Vector.range( 1000 ), v => v === 999 ), true )
		deepEqual( Vector.some( Vector.range( 1000 ), v => v <= 999 ), true )
		deepEqual( Vector.some( Vector.range( 1000 ), v => v < 500 ), true )
		deepEqual( Vector.some( Vector.range( 1000 ), v => v > 500 ), true )
		deepEqual( Vector.some( Vector.range( 1000 ), v => v < 0 ), false )
		deepEqual( Vector.Vector.range( 1000 ).some( v => v === 999 ), true )
		deepEqual( Vector.Vector.range( 1000 ).some( v => v <= 999 ), true )
		deepEqual( Vector.Vector.range( 1000 ).some( v => v < 500 ), true )
		deepEqual( Vector.Vector.range( 1000 ).some( v => v > 500 ), true )
		deepEqual( Vector.Vector.range( 1000 ).some( v => v < 0 ), false )
	}
	
	@test("every")
	every() {
		deepEqual( Vector.every( Vector.range( 1000 ), v => v === 999 ), false )
		deepEqual( Vector.every( Vector.range( 1000 ), v => v <= 999 ), true )
		deepEqual( Vector.every( Vector.range( 1000 ), v => v < 500 ), false )
		deepEqual( Vector.every( Vector.range( 1000 ), v => v > 500 ), false )
		deepEqual( Vector.every( Vector.range( 1000 ), v => v < 0 ), false )
		deepEqual( Vector.Vector.range( 1000 ).every( v => v === 999 ), false )
		deepEqual( Vector.Vector.range( 1000 ).every( v => v <= 999 ), true )
		deepEqual( Vector.Vector.range( 1000 ).every( v => v < 500 ), false )
		deepEqual( Vector.Vector.range( 1000 ).every( v => v > 500 ), false )
		deepEqual( Vector.Vector.range( 1000 ).every( v => v < 0 ), false )
	}

	@test("concat")
	concat() {
		deepEqual( Vector.concat( Vector.range( 100 ), Vector.range( 100, 200 ), Vector.range( 200, 300 )), Vector.range( 300 ))
		deepEqual( Vector.Vector.range(100).concat( Vector.Vector.range( 100, 200 ), Vector.Vector.range( 200, 300 )), Vector.Vector.range( 300 ))
		deepEqual( Vector.concat(), Vector.NIL )
	}

	@test("join")
	join() {
		deepEqual( Vector.join( Vector.range( 100 )), Vector.toArray( Vector.range( 100 )).join())
		deepEqual( Vector.join( Vector.range( 100 ), '::'), Vector.toArray( Vector.range( 100 )).join('::'))
		deepEqual( Vector.Vector.range( 100 ).join(), Vector.toArray( Vector.range( 100 )).join())
		deepEqual( Vector.Vector.range( 100 ).join(), Vector.Vector.range(100).toString())
		deepEqual( Vector.Vector.range( 100 ).join('::'), Vector.Vector.range( 100 ).toArray().join('::'))
	}

	@test("sort")
	sort() {
		deepEqual( Vector.sort( Vector.concat( Vector.range( 100, 200 ), Vector.range( 100 ), Vector.range( 200, 300 ))), Vector.range( 300 ))
		deepEqual( Vector.sort( Vector.concat( Vector.range( 100, 200 ), Vector.range( 100 ), Vector.range( 200, 300 )), (a,b) => a < b ? 1 : -1 ), Vector.range( 299, -1 ))
		deepEqual( Vector.Vector.range( 100, 200 ).concat( Vector.Vector.range( 100 ), Vector.Vector.range( 200, 300 )).sort(), Vector.Vector.range( 300 ))
		deepEqual( Vector.Vector.range( 100, 200 ).concat( Vector.Vector.range( 100 ), Vector.Vector.range( 200, 300 )).sort((a,b) => a < b ? 1 : -1), Vector.Vector.range( 299, -1 ))
		deepEqual( Vector.Vector.range( 1 ).sort().data, Vector.range( 1 ))
	}

	@test("count")
	count() {
		deepEqual( Vector.count( Vector.range( 100 ), v => v < 50 ), 50 )
		deepEqual( Vector.Vector.range( 100 ).count( v => v < 50 ), 50 )
	}

	@test("remove")
	remove() {
		deepEqual( Vector.remove( Vector.range( 100 ), 50, 0 ), Vector.range( 100 ))
		deepEqual( Vector.remove( Vector.range( 100 ), 50 ), Vector.concat( Vector.range(50 ), Vector.range( 51, 100 )))
		deepEqual( Vector.Vector.range( 100 ).delete( 50 ), Vector.Vector.range( 50 ).concat( Vector.Vector.range( 51, 100 )))
		deepEqual( Vector.Vector.range( 100 ).remove( -30 ), Vector.Vector.range( 70 ).concat( Vector.Vector.range( 71, 100 )))
		deepEqual( Vector.remove( Vector.range( 100 ), 50, 5 ), Vector.concat( Vector.range(50 ), Vector.range( 55, 100 )))
		deepEqual( Vector.Vector.range( 100 ).delete( 50, 5 ), Vector.Vector.range( 50 ).concat( Vector.Vector.range( 55, 100 )))
		deepEqual( Vector.Vector.range( 100 ).remove( -20 ), Vector.Vector.range( 80 ).concat( Vector.Vector.range( 81, 100 )))
		deepEqual( Vector.Vector.range( 100 ).remove( -20, 5 ), Vector.Vector.range( 80 ).concat( Vector.Vector.range( 85, 100 )))
	}
	
	@test("insert")
	insert() {
		deepEqual( Vector.insert( Vector.range( 100 ), 50 ), Vector.range( 100 ))
		deepEqual( Vector.insert( Vector.range( 100 ), 50, 0, 1, 2, 3, 4 ), Vector.concat( Vector.range( 50 ), Vector.range(5), Vector.range( 50, 100 )))
		deepEqual( Vector.insert( Vector.range( 100 ), -30, 0, 1, 2, 3, 4 ), Vector.concat( Vector.range( 70 ), Vector.range(5), Vector.range( 70, 100 )))	
		deepEqual( Vector.Vector.range( 100 ).insert( 20, 0, 1, 2, 3, 4 ), Vector.Vector.range( 20 ).concat( Vector.Vector.range(5), Vector.Vector.range(20,100)))
	}

	@test("slice")
	slice() {
		deepEqual( Vector.slice( Vector.range( 100 )), Vector.range( 100 ))
		deepEqual( Vector.slice( Vector.range( 100 ), 50 ), Vector.range( 50, 100 ))
		deepEqual( Vector.slice( Vector.range( 100 ), 50, 70 ), Vector.range( 50, 70 ))
		deepEqual( Vector.slice( Vector.range( 100 ), 30, 10 ), Vector.of())
		deepEqual( Vector.Vector.range( 100 ).slice( 50, 70 ).data, Vector.range( 50, 70 ))
		deepEqual( Vector.Vector.range(100).slice().data, Vector.range( 100 ))
		deepEqual( Vector.Vector.range(100).slice( 50 ).data, Vector.range( 50, 100 ))
		deepEqual( Vector.Vector.range(100).slice( 50, -10 ).data, Vector.range( 50, 90 ))
		deepEqual( Vector.Vector.range(100).slice( -50, -10 ).data, Vector.range( 50, 90 ))
	}

	@test("is")
	testis() {
		deepEqual( Vector.Vector.is( new Vector.Vector([1,2,3])), true )
		deepEqual( Vector.Vector.is( [] ), false )
	}

	@test("ofTransient")
	ofTransient() {
		const tvec = new TransientVector( [1,2,3,4] )
		deepEqual( Vector.Vector.ofTransient( tvec ), new Vector.Vector([1,2,3,4]))
		deepEqual( tvec, new TransientVector())
	}

	@test("splice")
	splice() {
		deepEqual( Vector.Vector.range( 100 ).splice( 50 ).data, Vector.range( 50 ))
	}

	@test("simulation")
	simulation() {
		let v = new Vector.Vector()
		for ( let i = 0; i < 32*32*32; i++ ) {
			v = v.push( i )
		}
		for ( let i = 0; i < 32*32*32; i++ ) {
			v = v.pop()
		}
		deepEqual( v.data, Vector.of())
	}

	/*
	@test("es2015")
	es2015() {
		const v = Vector.make( new Map<string,number[]>( [["a",[1,2]],["b",[3,4]],["c",[5]]] ))
		deepEqual( v, Vector.make( [["a",[1,2]],["b",[3,4]],["c",[5]]] ))
		let x = []
		for ( const y of Vector.Vector.of( 1, 2, 3, 4, 5 )) {
			x.push( y )
		}
		deepEqual( x, [1,2,3,4,5] )
	}
	*/
} 
