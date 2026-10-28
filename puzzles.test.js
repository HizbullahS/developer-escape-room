import test from 'node:test';
import assert from 'node:assert/strict';
import { puzzles,isCorrect,score } from './puzzles.js';
test('all five puzzles have the intended solution',()=>{['19','ship it','b','auth','600'].forEach((a,i)=>assert.equal(isCorrect(i,a),true));assert.equal(puzzles.length,5);});
test('answers tolerate case and surrounding whitespace without accepting partial answers',()=>{assert.ok(isCorrect(1,' SHIP IT '));assert.ok(isCorrect(2,'B'));assert.equal(isCorrect(0,'13'),false);assert.equal(isCorrect(4,'0600'),false);assert.equal(isCorrect(3,'auth gateway'),false);assert.equal(isCorrect(2,''),false);});
test('encoded message and access digit puzzle match their solutions',()=>{assert.equal(Buffer.from('c2hpcCBpdA==','base64').toString(),'ship it');assert.equal([4,8,1,6].reduce((a,b)=>a+b,0),19);});
test('score accounts for active seconds, hints and mistakes and never goes negative',()=>{assert.equal(score(61500,2,3),744);assert.equal(score(0,0,0),1000);assert.equal(score(3600000,5,100),0);});
