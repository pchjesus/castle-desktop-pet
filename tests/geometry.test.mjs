import { test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { constrain } from '../electron/geometry.mjs';
const screens = [{x:-1920,y:0,width:1920,height:1040},{x:0,y:0,width:1920,height:1040}];
test('negative monitor coordinates are retained', () => deepStrictEqual(constrain({x:-500,y:100,width:240,height:300},screens),{x:-500,y:100,width:240,height:300}));
test('offscreen window is returned to nearest work area', () => deepStrictEqual(constrain({x:3000,y:1000,width:240,height:300},screens),{x:1680,y:740,width:240,height:300}));
test('oversized windows fit work area', () => deepStrictEqual(constrain({x:0,y:0,width:3000,height:2000},[{x:0,y:0,width:800,height:600}]),{x:0,y:0,width:800,height:600}));
