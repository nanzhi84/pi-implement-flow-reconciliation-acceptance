const name = process.argv[2];
if (!name || !name.trim() || /[\r\n]/.test(name)) process.exitCode = 2;
else process.stdout.write(`Hello, ${name}!\n`);
