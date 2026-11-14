import fs from 'fs';
import path from 'path';

async function buildVercelApiBundle() {
  const outFile = path.resolve(process.cwd(), 'api', 'index.js');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  let esbuild;
  try {
    esbuild = await import('esbuild');
  } catch {
    if (fs.existsSync(outFile)) {
      console.log('[build-api] esbuild not found; keeping prebuilt api/index.js.');
      return;
    }
    throw new Error('esbuild is required to build api/index.js');
  }

  await esbuild.build({
    entryPoints: [path.resolve(process.cwd(), 'server.ts')],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    define: {
      'process.env.VERCEL': '"1"',
    },
    minify: false,
    logLevel: 'info',
  });

  console.log('[build-api] Successfully built standalone Vercel ESM function: api/index.js');
}

buildVercelApiBundle().catch((err) => {
  console.error('[build-api] Failed:', err);
  process.exit(1);
});
