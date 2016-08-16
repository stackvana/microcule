import sleep from 'then-sleep';
export default async function (hook) {
  await sleep(1);
  hook.res.end("Hello world!");
}