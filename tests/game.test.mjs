import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSwipe,shotPosition,START,RIM} from '../src/game.js';
test('straight medium swipe makes the target on phone and desktop',()=>{for(const [w,h] of [[393,852],[1440,900]])assert.equal(evaluateSwipe(0,-h*.4,w,h).made,true);});
test('sideways, short or invalid gestures cannot count as a basket',()=>{assert.equal(evaluateSwipe(0,0,393,852),null);assert.equal(evaluateSwipe(200,-340,393,852).made,false);assert.equal(evaluateSwipe(0,-40,393,852).made,false);assert.equal(evaluateSwipe(0,-400,0,852),null);});
test('trajectory starts at the ball and passes through the scored rim',()=>{assert.deepEqual(shotPosition(0,{x:0,depth:0}),START);const end=shotPosition(1,{x:0,depth:0});assert.ok(Math.abs(end.y-RIM.y)<1e-8);assert.ok(Math.abs(end.z-RIM.z)<1e-8);assert.ok(shotPosition(.5,{x:0,depth:0}).y>RIM.y);});
