import { Octokit } from 'octokit';
import fs from 'fs';
import extract from 'extract-zip';
import path from 'path';
import os from 'os';
import sloc from 'node-sloc';
import dotenv from 'dotenv';
dotenv.config();

const appPrefix = 'metrica';

const resDict = {
  paths: 'An array of all filepaths counted',
  loc: 'Lines of code (SLOC + comments)',
  sloc: 'Source lines of code',
  blank: 'Number of blank lines',
  comments: 'Lines of comments',
  files: 'Number of files counted',
};

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

const getTempDir = () => {
  const randomStr = Math.random().toString(36).substring(2, 10);
  return fs.mkdtempSync(path.join(os.tmpdir(), `${appPrefix}-${randomStr}`));
};

const delDirRecursive = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = path + '/' + file;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        delDirRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const downloadRepoZip = async (owner, repo) => {
  const response = await octokit.request('GET /repos/{owner}/{repo}/zipball', {
    owner,
    repo,
    ref: 'heads',
  });

  const tempDir = getTempDir();
  const zipFullPath = path.join(tempDir, `${repo}.zip`);
  fs.appendFileSync(zipFullPath, Buffer.from(response.data));
  return [zipFullPath, tempDir];
};

export const logLocResult = (obj) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (key === 'paths') return;
    console.log(`${resDict[key]}: ${value}`);
  });
};

export const getRepoLoc = async (owner, repo) => {
  const [zipFullPath, tempDir] = await downloadRepoZip(owner, repo);

  await extract(zipFullPath, {
    dir: `${tempDir}/${repo}`,
  });

  const options = {
    path: `${tempDir}/${repo}`,
    // ext: ['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css'],
    ignorePaths: ['node_modules'],
  };

  const { paths, ...res } = await sloc(options).catch(console.log);
  console.log(`--- ${repo} ---`);
  logLocResult(res);
  console.log('\n');

  delDirRecursive(tempDir);

  return res;
};

export const sumAllInfo = (reposInfo) =>
  reposInfo.reduce((acc, curr) => {
    Object.entries(curr).forEach(([key, value]) => {
      if (key === 'paths') return;
      acc[key] = acc[key] ? acc[key] + value : value;
    });
    return acc;
  }, {});
