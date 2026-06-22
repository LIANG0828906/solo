function calculateSum(a, b, c = 0) {
  return a + b + c;
}

function greet(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

const PI = 3.1415926535;

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}

console.log("Application started");
