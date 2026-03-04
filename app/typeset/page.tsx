import styles from "./page.module.css";

const SIZES = [
  {
    className: "global-text-xl",
    label: "global-text-xl",
    heading: "特大見出しテキスト Extra Large",
    body: "山路を登りながら、こう考えた。智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。",
  },
  {
    className: "global-text-lg",
    label: "global-text-lg",
    heading: "見出しテキスト Large",
    body: "山路を登りながら、こう考えた。智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。",
  },
  {
    className: "global-text-md",
    label: "global-text-md",
    heading: "本文テキスト Medium",
    body: "山路を登りながら、こう考えた。智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。",
  },
  {
    className: "global-text-sm",
    label: "global-text-sm",
    heading: "補足テキスト Small",
    body: "山路を登りながら、こう考えた。智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。",
  },
  {
    className: "global-text-xs",
    label: "global-text-xs",
    heading: "注釈テキスト Extra Small",
    body: "山路を登りながら、こう考えた。智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。",
  },
];

export default function TypesetPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {SIZES.map((size) => (
          <section key={size.className} className={styles.section}>
            <span className={styles.label}>{size.label}</span>
            <h2 className={size.className}>{size.heading}</h2>
            <p className={size.className}>{size.body}</p>
            <hr className={styles.divider} />
          </section>
        ))}
      </div>
    </div>
  );
}
