import { segment } from "oicq";
import fetch from "node-fetch";
import plugin from '../../../lib/plugins/plugin.js'

// 使用方法：
// #百科XX
// 有问题可以@渔火反馈


//项目路径
const _path = process.cwd();
let siliao = false  //是否允许私聊使用，设为false则禁止私聊使用百科功能（主任除外）

//1.定义命令规则
export class BDbaike extends plugin {
    constructor() {
        super({
            name: "BDbaike",
            dsc: "百科",
            event: "message",
            priority: 5000, //优先级，越小优先度越高
            rule: [
                {
                    // reg: '^(.*)https:(.*)$',
                    reg: "^#*百科(.*)$", //匹配消息正则，命令正则
                    fnc: 'BDbaike'
                }
            ],
        });
    }

//百度百科
async BDbaike(e) {
  if (!siliao) 
    if (e.isPrivate && !e.isMaster) {
      return true;
    }
  let msg = e.msg
  msg = msg.replace(/#|百科/g, "").trim();
  if (!msg) return;

  let url = `https://ovooa.com/API/bdbk/?Msg=${msg}`;
  let response = await fetch(url);
  let res = await response.json();

  if (res.code == -2) {
    e.reply("百度百科暂未收录词条“"+msg+"”");
    return true
  }
  if (res.code == -1) {
    e.reply("请输入需要百科的内容");
    return true
  }
  if (res.code !=1) {
    e.reply("未知错误，请联系开发者反馈");
    return true
  }
  msg = [
    // "【",segment.text(res.data.Msg),"】",
    segment.image(res.data.image),
    segment.text(res.data.info),"\n",
    "详情：",segment.text(res.data.url)
  ];
 e.reply(msg);
  return true; //返回true 阻挡消息不再往下
    }
}