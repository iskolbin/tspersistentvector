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
}
