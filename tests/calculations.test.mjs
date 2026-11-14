import test from 'node:test';
import assert from 'node:assert/strict';
import { Calculator, calculate } from '../public/calculations.mjs';

function sequence(...keys) {
  const calc = new Calculator();
  keys.forEach(key => calc.press(key));
  return calc;
}
test('기본 계산기는 입력 순서대로 연산하고 부동소수점 오차를 정리한다', () => {
  assert.equal(sequence('2','+','3','*','4','=').display,'20');
  assert.equal(sequence('0','.','1','+','0','.','2','=').display,'0.3');
  assert.equal(sequence('9','+','*','2','=').display,'18');
  assert.equal(sequence('9','sign','+','2','=').display,'-7');
  assert.equal(sequence('2','5','%').display,'0.25');
  assert.equal(sequence('1','0','0','0','0','back').display,'1,000');
});
test('0으로 나누면 오류를 표시하고 다음 숫자로 새 계산을 시작한다', () => {
  const calc = sequence('5','/','0','=');
  assert.match(calc.error,/0으로/);
  calc.press('2');
  assert.equal(calc.display,'2');
  assert.equal(calc.error,'');
});
test('퍼센트, 비율 및 증감률 계산', () => {
  assert.equal(calculate('percent',{ mode:'portion',base:80000,part:15 }).value,'12,000');
  assert.equal(calculate('percent',{ mode:'ratio',base:80,part:20 }).value,'25%');
  assert.equal(calculate('percent',{ mode:'change',base:100,part:75 }).value,'-25%');
  assert.throws(() => calculate('percent',{mode:'ratio',base:0,part:1}),/기준값/);
});
test('할인 계산은 원 단위이며 양 끝 할인율을 지원한다', () => {
  for (const [rate,value] of [[0,'1,001원'],[50,'500원'],[100,'0원']]) {
    assert.equal(calculate('discount',{price:1001,rate}).value,value);
  }
  assert.throws(() => calculate('discount',{price:1,rate:101}));
});
test('날짜 차이는 윤일과 시작일 포함 옵션을 처리한다', () => {
  assert.equal(calculate('dates',{start:'2024-02-28',end:'2024-03-01'}).value,'2일');
  assert.equal(calculate('dates',{start:'2024-02-29',end:'2024-02-29',inclusive:'on'}).value,'1일');
  assert.throws(() => calculate('dates',{start:'2025-02-29',end:'2025-03-01'}));
  assert.throws(() => calculate('dates',{start:'2024-03-01',end:'2024-02-29'}));
});
test('단위 변환은 평과 제곱미터를 양방향으로 계산한다', () => {
  assert.equal(calculate('units',{category:'area',from:'평',to:'㎡',amount:121}).value,'400 ㎡');
  assert.equal(calculate('units',{category:'area',from:'㎡',to:'평',amount:400}).value,'121 평');
  assert.equal(calculate('units',{category:'length',from:'m',to:'cm',amount:0}).value,'0 cm');
  assert.throws(() => calculate('units',{category:'mass',from:'m',to:'cm',amount:1}));
});
test('더치페이 계산은 나머지 원을 배분하며 빈 값과 잘못된 인원수를 거부한다', () => {
  assert.match(calculate('split',{total:10000,count:3}).detail,/1명은 3,334원, 나머지 2명은 3,333원/);
  assert.equal(calculate('split',{total:0,count:3}).value,'0원');
  for (const count of [0,-1,1.5,'']) assert.throws(() => calculate('split',{total:10000,count}));
});
