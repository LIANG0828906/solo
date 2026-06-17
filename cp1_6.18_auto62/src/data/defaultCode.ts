export const defaultCode = `let total = 0;
let count = 5;

for (let i = 1; i <= count; i++) {
  total = total + i;
  console.log("i = " + i + ", total = " + total);
}

let average = total / count;
console.log("Average: " + average);

if (average > 3) {
  console.log("Average is greater than 3");
} else {
  console.log("Average is 3 or less");
}`;
