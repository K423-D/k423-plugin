/**
 * 原作者碎月佬
 * https://gitee.com/Acceleratorsky/suiyue
 */
import plugin from '../../../lib/plugins/plugin.js'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer');

export class webScreenshot extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '截图预览网页内容',
      /** 功能描述 */
      dsc: '群里发送网页地址，截图预览网页内容',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#screenshot:",
          /** 执行方法 */
          fnc: 'screenshot'
        }
      ]

    })
  }

  /**
   * 
   */
  async screenshot(e) {
    const url = e.msg.replace('#screenshot:', '')
    const reg = new RegExp('^(?:(http|https):\/\/)?((?:[\\w-]+\\.)+[a-z0-9]+)((?:\/[^\/?#]*)+)?(\\?[^#]+)?(#.+)?$')
    const reg2 = new RegExp('(b23.tv)|(bili(22|23|33|2233).cn)|(.bilibili.com)|(^(av|cv)(\\d+))|(^BV([a-zA-Z0-9]{10})+)')
    if (!reg.test(url)) {
      e.reply(['请检查带上的链接格式是否正确哦~'])
      return false
    }
    if (reg2.test(url)) {
      e.reply(['B站的链接不进行处理哦~'])
      return false
    }
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process'
      ]
    });
    const page = await browser.newPage();

    await page.goto(url);
    await page.setViewport({
      width: 1920,
      height: 1080
    });

    await this.reply(segment.image(await page.screenshot({
      fullPage: true
    })))

    await browser.close();
  }
}