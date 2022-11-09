import puppeteer from 'puppeteer';

import Logger from './logger';

class Browser {
  private logger = new Logger('browser');

  async htmlToPdf(html: string) {
    try {
      this.logger.info('generating pdf from html');

      const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true
      });

      const page = await browser.newPage();
      await page.setContent(html);
      await page.emulateMediaType('screen');

      const pdf = await page.pdf({
        format: 'A4'
      });
      await browser.close();

      this.logger.info('generated pdf from html');
      return pdf;
    } catch (error) {
      this.logger.error('error while generating pdf from html');
      throw error;
    }
  }
}

export default new Browser();
