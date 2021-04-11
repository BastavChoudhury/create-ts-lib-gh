import { mkdir, readdir, readFile, rename, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { render } from 'ejs';

export type ProjectInfo = {
  library: {
    name: string;
    description: string;
    keywords: string[];
  };
  author: {
    name: string;
    email: string;
  };
  github: {
    repository: string;
  };
};

export async function setupProject(info: ProjectInfo): Promise<void> {
  const templateRoot = join(__dirname, '..', 'template');
  const libraryRoot = join(process.cwd(), info.library.name);

  await copyAndTransform(templateRoot, libraryRoot, info);

  const src = (fileName: string) => join(libraryRoot, 'src', fileName);

  await rename(src('lib-name.ts'), src(`${info.library.name}.ts`));
  await rename(src('lib-name.spec.ts'), src(`${info.library.name}.spec.ts`));
}

async function copyAndTransform(inputDir: string, outputDir: string, info: ProjectInfo) {
  for await (const fileName of listFileNames(inputDir)) {
    const templateFile = join(inputDir, fileName);
    const outputFile = join(outputDir, fileName);

    const fileContent = await readFile(templateFile, { encoding: 'utf-8' });
    const transformedContent = render(fileContent, info);

    try {
      await mkdir(dirname(outputFile), { recursive: true });
    } catch (ignored) {}

    await writeFile(outputFile, transformedContent);
  }
}

async function* listFileNames(absoluteDir: string, relativeDir = ''): AsyncGenerator<string> {
  const dirents = await readdir(absoluteDir, { withFileTypes: true });
  for (const dirent of dirents) {
    const direntName = dirent.name;
    if (dirent.isDirectory()) {
      yield* listFileNames(join(absoluteDir, direntName), join(relativeDir, direntName));
    } else {
      yield join(relativeDir, direntName);
    }
  }
}
