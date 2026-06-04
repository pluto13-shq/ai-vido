import type { Language } from "@/lib/types";

export interface StoryBeat {
  heading: string;
  action: string;
  dialogue: string;
}

function beggarBeats(language: Language): StoryBeat[] {
  if (language === "zh") {
    return [
      {
        heading: "第一幕 · 起",
        action: "寒冬深夜，乞丐阿尘蜷缩在桥洞，手里攥着半块发霉的馒头，路人匆匆避开。",
        dialogue: "「再饿一天，我可能撑不到天亮。」",
      },
      {
        heading: "第二幕 · 承",
        action: "一位落魄老人把旧书塞给他，说书里藏着翻身的路；阿尘半信半疑地翻开。",
        dialogue: "「书能当饭吃吗？」老人笑：「能当地图。」",
      },
      {
        heading: "第三幕 · 转",
        action: "阿尘白天学手艺、晚上练表达，把街头见闻拍成短片，第一条视频意外走红。",
        dialogue: "「原来被看不起的经历，也能变成故事。」",
      },
      {
        heading: "第四幕 · 合",
        action: "一年后，他站在小店门口接待客人，身后墙上挂着「乞丐的逆袭之路」招牌。",
        dialogue: "「我不是逆袭神话，只是一步一步没放弃。」",
      },
    ];
  }
  return [
    {
      heading: "Act I · Setup",
      action: "On a freezing night, beggar A-Chen huddles under a bridge with half a stale bun.",
      dialogue: '"One more day hungry and I might not see sunrise."',
    },
    {
      heading: "Act II · Rising",
      action: "A worn old man hands him a book, saying it hides a way out; A-Chen opens it, skeptical.",
      dialogue: '"Can a book feed me?" The old man smiles: "It can map the road."',
    },
    {
      heading: "Act III · Turn",
      action: "He learns a trade by day and storytelling by night; his first street video goes viral.",
      dialogue: '"What people despised became my story."',
    },
    {
      heading: "Act IV · Payoff",
      action: "A year later he greets customers at his own shop; a sign reads The Beggar\'s Comeback.",
      dialogue: '"Not a myth—just steps without quitting."',
    },
  ];
}

function genericBeats(title: string, language: Language): StoryBeat[] {
  const t = title.trim();
  if (language === "zh") {
    return [
      {
        heading: "第一幕 · 起",
        action: `《${t}》的主角陷入人生低谷，环境压抑，命运似乎已写定。`,
        dialogue: "「难道我就这样认命了吗？」",
      },
      {
        heading: "第二幕 · 承",
        action: "一次偶然机遇出现，主角咬牙决定抓住，开始艰难却坚定的改变。",
        dialogue: "「这一次，我要为自己拼一把。」",
      },
      {
        heading: "第三幕 · 转",
        action: "挫折与成长交织，主角在关键抉择中突破自我，故事线明显上扬。",
        dialogue: "「我终于看清了该走的路。」",
      },
      {
        heading: "第四幕 · 合",
        action: `结局揭晓：主角完成《${t}》的核心逆袭，与开篇困境形成对照。`,
        dialogue: "「这条路，我走到了光里。」",
      },
    ];
  }
  return [
    {
      heading: "Act I · Setup",
      action: `The hero of "${t}" hits rock bottom; the world feels already written.`,
      dialogue: '"Am I really going to accept this?"',
    },
    {
      heading: "Act II · Rising",
      action: "A chance appears; the hero chooses to fight and change step by step.",
      dialogue: '"This time I fight for myself."',
    },
    {
      heading: "Act III · Turn",
      action: "Setbacks and growth collide; a pivotal choice lifts the arc.",
      dialogue: '"I finally see the road I must take."',
    },
    {
      heading: "Act IV · Payoff",
      action: `The ending pays off "${t}"—a clear contrast to the opening trap.`,
      dialogue: '"I walked this road into the light."',
    },
  ];
}

export function getTitleAwareVideoBeats(
  title: string,
  language: Language
): StoryBeat[] {
  const t = title.trim();
  if (/乞丐|乞儿|beggar/i.test(t)) {
    return beggarBeats(language);
  }
  return genericBeats(t, language);
}

export function generateNovelFromTitleFallback(
  title: string,
  language: Language
): string {
  const beats = getTitleAwareVideoBeats(title, language);
  return beats
    .map((b) => {
      const line = b.dialogue.replace(/^[「"]|[」"]$/g, "");
      return `${b.action}${line ? ` ${language === "zh" ? "「" : '"'}${line}${language === "zh" ? "」" : '"'}` : ""}`;
    })
    .join("\n\n");
}

export function buildTitleLogline(title: string, language: Language): string {
  const t = title.trim();
  if (/乞丐|beggar/i.test(t)) {
    return language === "zh"
      ? `一句故事：寒冬里的乞丐阿尘，沿着《${t}》一步步从桥洞走到属于自己的小店。`
      : `Logline: beggar A-Chen follows "${t}" from a bridge to his own shop.`;
  }
  return language === "zh"
    ? `一句故事：《${t}》讲述主角从低谷到逆袭的完整弧线，起承转合清晰可拍。`
    : `Logline: "${t}" follows a full arc from trap to turnaround.`;
}
