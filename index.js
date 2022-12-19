import { getRepoLoc, logLocResult, sumAllInfo } from './utils.js';

const owner = 'nautes-tech';
const repoNames = ['milan', 'tecnoindagini', 'aib-web', 'af-live'];

const main = async () => {
  const promises = repoNames.map((repo) => getRepoLoc(owner, repo));
  const reposInfo = await Promise.all(promises);

  const total = sumAllInfo(reposInfo);
  console.log('--- TOTAL ---');
  logLocResult(total);
};

main();
