import * as Vector from './src/Vector'
import { suite, test, slow, timeout } from "mocha-typescript"
import { assert, deepEqual, throws } from "assert"

@suite class VectorSuite {
	@test("make without arg")
	makeCaseNone() {
		deepEqual( Vector.make(), {
			size: 0,
			shift: 0,
			root: undefined,
			tail: []
		})
	}

	@test("make with []")
	makeCase0() {
		deepEqual( Vector.make( [] ), {
			size: 0,
			shift: 0,
			root: undefined,
			tail: []
		})
	}
	
	@test("make with [1,2,3]")
	makeCase3() {
		deepEqual( Vector.make([1,2,3]), {
			size: 3,
			shift: 0,
			root: undefined,
			tail: [1,2,3]
		})
	}
	
	@test("make with [1,2,3...,33] (33 elements)")
	makeCase33() {
		deepEqual( Vector.make([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]), {
			size: 33,
			shift: 0,
			root: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
			tail: [33]
		})
	}

	@test("make with [1,2,3...,67] (67 elements)")
	makeCase67() {
		deepEqual( Vector.make([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]),
			{ 
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
	ofCase33() {
		deepEqual( Vector.of(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33), {
			size: 33,
			shift: 0,
			root: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
			tail: [33]
		})
	}

	@test("repeat with (10,33)")
	repeat33() {
		deepEqual( Vector.repeat( 1, 33 ), {
			size: 33,
			shift: 0,
			root: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
			tail: [1]
		})
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
	}

	@test("last")
	last() {
		deepEqual( Vector.last( Vector.range( 67 )), 66 )	
	}
	
	@test("first")
	first() {
		deepEqual( Vector.first( Vector.range( 10,77 )), 10 )	
	}

	@test("isEmpty")
	isEmpty() {
		deepEqual( Vector.isEmpty( Vector.make()), true )
		deepEqual( Vector.isEmpty( Vector.clear( Vector.of(1,2,3,4) )), true )
	}

	@test("push 1 to empty")
	pushToEmpty() {
		deepEqual( Vector.push( Vector.of(), 1 ), Vector.of( 1 ))
	}

	@test("push 31 to range(31)")
	pushToRange31() {
		deepEqual( Vector.push( Vector.range(31), 31 ), Vector.range(32) )
	}

	@test("push 32 to range(32)")
	pushToRange32() {
		deepEqual( Vector.push( Vector.range(32), 32 ), Vector.range(33) )
	}

	@test("push 63 to range(63)")
	pushToRange63() {
		deepEqual( Vector.push( Vector.range(63), 63 ), Vector.range(64) )
	}

	@test("push 65,66,67 to range(64)")
	pushToRange64() {
		deepEqual( Vector.push( Vector.range(64), 64,65,66 ), Vector.range(67) )
	}

	@test("push 1023,1024 to range(1023)")
	pushToRange1024() {
		deepEqual( Vector.push( Vector.range(1023), 1023,1024 ), Vector.range(1025) )
	}

	@test("get from empty")
	getFromEmpty() {
		deepEqual( Vector.get( Vector.of(), 0 ), undefined )
	}

	@test("get from range(32)")
	getFromRange32() {
		const v = Vector.range(32)
		for ( let i = 0; i < 32; i++ ) deepEqual( Vector.get( v, i ), i )
	}

	@test("get from range(64)")
	getFromRange64() {
		const v = Vector.range(64)
		for ( let i = 0; i < 64; i++ ) deepEqual( Vector.get( v, i ), i )
	}
	
	@test("get from range(128)")
	getFromRange128() {
		const v = Vector.range(128)
		for ( let i = 0; i < 128; i++ ) deepEqual( Vector.get( v, i ), i )
	}

	@test("get from range(1025)")
	getFromRange1025() {
		const v = Vector.range(1025)
		for ( let i = 0; i < 1025; i++ ) deepEqual( Vector.get( v, i ), i )
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
			for ( let i = 0; i < n; i++ ) {
				v = Vector.set( v, i, i !== 0 ? -i : i )
			}
			const range = Vector.range( -n )
			deepEqual( v, range )
		}
	}

	@test("update out of range")
	updateOut() {
		deepEqual( Vector.update( Vector.range(16), 32, v => v + 1 ), Vector.range(16))
	}
	
	@test("update range(16)")
	updateRange16() {
		deepEqual( Vector.update( Vector.range(16), 7, v => -v ), Vector.of(0,1,2,3,4,5,6,-7,8,9,10,11,12,13,14,15))
	}

	@test("pop empty")
	popEmpty() {
		deepEqual( Vector.pop( Vector.of()), Vector.of())
	}

	@test("pop range(16,31,32,33,63,64,64,1023,1024,1025,3000) default count")
	popRanges16() {
		for ( const n of [16,31,32,33,63,64,64,1023,1024,1025,300]) {
			deepEqual( Vector.pop( Vector.range(n)), Vector.range( n-1 ))
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
		const range = []
		for ( let i = 0; i < 2883; i++ ) {
			range[i] = i
		}
		Vector.forEach( Vector.range(2883), v => array.push(v))
		deepEqual( array, range )
		deepEqual( Vector.make( range ), Vector.range( 2883 ))
	}

	@test("reduce")
	reduce() {
		deepEqual( Vector.reduce( Vector.repeat( 1, 100 ), (acc,v) => acc + v ), 100 )
		deepEqual( Vector.reduce( Vector.repeat( 1, 100 ), (acc,v) => acc + v, 50 ), 150 )
		deepEqual( Vector.reduce( Vector.range(16), (acc,v) => acc.concat([v]), [-1]), [-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
	}

	@test("reduceRight")
	reduceRight() {
		deepEqual( Vector.reduceRight( Vector.repeat( 1, 100 ), (acc,v) => acc + v ), 100 )
		deepEqual( Vector.reduceRight( Vector.repeat( 1, 100 ), (acc,v) => acc + v, 50 ), 150 )
		deepEqual( Vector.reduceRight( Vector.range( 100 ), (acc,v) => acc.concat([v]), [] as number[] ), Vector.toArray( Vector.range(100)).reverse())
	}

	@test("finished iterator")
	finishedIterator() {
		const iter = Vector.iterator( Vector.range(10))
		for ( let i = 0; i < 10; i++ ) iter.getNext()
		try {
			iter.getNext()
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
	}

	@test("sum")
	sum() {
		deepEqual( Vector.sum( Vector.repeat( 10, 10 )), 100 )
	}

	@test("reverse")
	reverse() {
		deepEqual( Vector.range( 100 ), Vector.reverse( Vector.range( 99, -1 )))
	}

	@test("filter")
	filter() {
		deepEqual( Vector.filter( Vector.range( 1500 ), v => v < 750 ), Vector.range( 750 ))
	}
	
	@test("reject")
	reject() {
		deepEqual( Vector.reject( Vector.range( 1500 ), v => v < 750 ), Vector.range( 750, 1500 ))
	}

	@test("indexOf")
	indexOf() {
		deepEqual( Vector.indexOf( Vector.range( 1000 ), 500 ), 500 )
		deepEqual( Vector.indexOf( Vector.repeat( 0, 1000 ), 0 ), 0 )
		deepEqual( Vector.indexOf( Vector.repeat( 0, 1000 ), 1 ), -1 )
	}
	
	@test("lastIndexOf")
	lastIndexOf() {
		deepEqual( Vector.lastIndexOf( Vector.range( 1000 ), 500 ), 500 )
		deepEqual( Vector.lastIndexOf( Vector.repeat( 0, 1000 ), 0 ), 999 )
		deepEqual( Vector.indexOf( Vector.repeat( 0, 1000 ), 1 ), -1 )
	}

	@test("find")
	find() {
		deepEqual( Vector.find( Vector.range( 1000 ), i => i > 500 ), 501 )
		deepEqual( Vector.find( Vector.range( 1000 ), i => i > 1500 ), undefined )
	}

	@test("findLast")
	findLast() {
		deepEqual( Vector.findLast( Vector.range( 1000 ), i => i > 500 ), 999 )
		deepEqual( Vector.findLast( Vector.range( 1000 ), i => i > 1500 ), undefined )
	}
	
	@test("findIndex")
	findIndex() {
		deepEqual( Vector.findIndex( Vector.range( 1000 ), i => i > 500 ), 501 )
		deepEqual( Vector.findIndex( Vector.range( 1000 ), i => i > 1500 ), -1 )
	}

	@test("findLastIndex")
	findLastIndex() {
		deepEqual( Vector.findLastIndex( Vector.range( 1000 ), i => i > 500 ), 999 )
		deepEqual( Vector.findLastIndex( Vector.range( 1000 ), i => i > 1500 ), -1 )
	}
	
	@test("includes")
	includes() {
		deepEqual( Vector.includes( Vector.range( 1060 ), 514 ), true )
		deepEqual( Vector.includes( Vector.range( 1060 ), 1514 ), false )
	}
}
