import plugin from '../../../lib/plugins/plugin.js'


export class mistakeList extends plugin {
  constructor() {
    super({
      name: '谬误列表',
      dsc: '谬误列表',
      event: 'message',
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#谬误列表$",
          /** 执行方法 */
          fnc: 'mistakeList'
        }
      ]
    })
  }

  async mistakeList(e) {
    //最后回复消息
    let msg = [
      //@用户
      segment.at(e.user_id),
      //文本消息
      "\n祝您对线愉快~",
      //图片
      segment.image(`http://test.k423.cn/mistake_list.png`),
    ];
    //发送消息
    e.reply(msg);
    return true; //返回true 阻挡消息不再往下
  }
}