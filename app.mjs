const name = process.argv[2];
if (name === undefined || /[\r\n]/.test(name) || name.trim() === '') process.exitCode = 2;
else process.stdout.write(`Hello, ${name}!\n`);
