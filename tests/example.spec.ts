import { test } from '@playwright/test';
import chalk from 'chalk';
import cliTable from 'cli-table';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Read from default ".env" file.
dotenv.config();

const log = console.log;

test('get isbn book list', async ({ page }) => {
  await page.goto(
    'https://isbnnew.inflibnet.ac.in/admnis/applicant/Login.aspx'
  );
  await page.getByPlaceholder('User Name').click();
  await page.getByPlaceholder('User Name').fill(process.env.email);
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill(process.env.password);
  await page.getByRole('textbox', { name: 'Security Code' }).click();
  const captcha = await page
    .locator("[name='hdnCaptcha']")
    .getAttribute('value');
  log(chalk.bgGray.bold.italic(captcha));
  await page.getByRole('textbox', { name: 'Security Code' }).fill(captcha);
  await page.locator('#submit').click();
  await page.waitForLoadState('networkidle'); // This resolves after 'networkidle'

  const applications = page.getByText('Click here');
  const applicationIds = await applications.evaluateAll((apps) => {
    const applicationIds = [];
    apps.forEach((item) => {
      const id = item.getAttribute('id').replace('isbn_', '');
      if (Number.isSafeInteger(Number(id))) {
        applicationIds.push(id);
      }
    });
    return applicationIds;
  });

  log(chalk.magentaBright('app ids: ' + applicationIds.join(',')));
  const finalData = {};
  for (let i = 0; i < applicationIds.length; i++) {
    const url = `https://isbnnew.inflibnet.ac.in/admnis/applicant/ISBNAppliedBooklist.aspx?app_id=${applicationIds[i]}&langid=1&imp=0`;
    await page.goto(url, { waitUntil: 'networkidle' });
    page.once('dialog', (dialog) => {
      log(chalk.grey(`Dialog message: ${dialog.message()}`));
      dialog.dismiss().catch(() => {});
    });

    const head = await page
      .locator('#applicatingrid > tbody > tr:nth-child(1) > th')
      .evaluateAll((list) => {
        const head = [];
        list.forEach((th) => head.push(th.textContent.trim()));
        return head;
      });

    const tableHeader = new cliTable({
      head,
    });

    log(chalk.bgBlueBright(tableHeader.toString()));

    const pageLinks = page.locator(
      '#applicatingrid > tbody > tr:last-child > td > table > tbody > tr > td > a'
    );

    let table = [];
    for (let i = -1; i < (await pageLinks.count()); i++) {
      if (i !== -1) {
        try {
          await pageLinks.nth(i).click();
          await page.waitForLoadState('networkidle'); // This resolves after 'networkidle'
        } catch (e) {}
      }

      const list = await page
        .locator(
          '#applicatingrid > tbody > tr:not(:first-child):not(:last-child)'
        )
        .evaluateAll((list) =>
          list.map((tr) => {
            const values = [];
            tr.querySelectorAll('td').forEach((val) => {
              if (
                val.hasChildNodes &&
                val.querySelector('img')?.hasAttribute('src')
              ) {
                values.push(val.querySelector('img').getAttribute('src'));
                return;
              }
              values.push(val.innerText.trim());
            });
            return values;
          })
        );

      table = table.concat(list);
      const tableRows = new cliTable({
        rows: list,
      });

      log(chalk(tableRows));
    }

    finalData[applicationIds[i]] = {
      head,
      table,
    };
  }

  const today = new Date();
  const todayLocal = today
    .toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .split(' ')
    .reverse();

  const isbnPath = path.join('isbn', ...todayLocal);
  const lastRunPath = path.join(__dirname, '..', 'isbn');
  const folder = path.join(__dirname, '..', isbnPath);
  await fs.mkdir(folder, { recursive: true });
  const saveData = {
    folder,
    data: finalData,
  };
  await fs.writeFile(
    path.join(lastRunPath, 'lastPath.js'),
    `export const lastPath="/isbn/${todayLocal.join('/')}"`
  );
  await fs.writeFile(path.join(folder, 'isbn.json'), JSON.stringify(saveData));
});

test('test', async () => {
  const today = new Date();
  const todayLocal = today
    .toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .split(' ')
    .reverse();

  const isbnPath = path.join('isbn', ...todayLocal);

  console.log(`export const lastPath="/isbn/${todayLocal.join('/')}"`);
});
