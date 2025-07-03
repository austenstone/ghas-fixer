import 'dotenv/config'

console.log('Hello World!');

// async await test top level
const result = await new Promise((resolve) => {
  setTimeout(() => {
    resolve('done');
  }, 1000);
});

console.log(result);
