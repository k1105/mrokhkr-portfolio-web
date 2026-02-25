import Image from "next/image";
import {getWorks} from "../../lib/notion";
import styles from "./page.module.css";
import FadeText from "./FadeText";
import TransitionLink from "../components/TransitionLink";

interface CategoryInfo {
  param: string;
  display: string;
  search: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    param: "visual-communication",
    display: "伝えるものをつくる Visual Communication",
    search: "伝えるものをつくる",
  },
  {
    param: "workshops-facilitation",
    display: "関わりあう場をつくる Workshops & Facilitation",
    search: "関わりあう場をつくる",
  },
  {
    param: "books-editorial",
    display: "読みものをつくる Books & Editorial design",
    search: "読みものをつくる",
  },
  {
    param: "study-research",
    display: "試して、研究する Study & Research",
    search: "試して、研究する",
  },
];

export default async function WorksPage() {
  const works = await getWorks();

  // カテゴリごとにグルーピング
  const worksByCategory = CATEGORIES.map((category) => ({
    category,
    works: works.filter((work) => work.category === category.search),
  }));

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {worksByCategory.map(({category, works: categoryWorks}) => (
          <section key={category.param} className={styles.section}>
            <h2 className={styles.categoryTitle}>{category.display}</h2>
            <div className={styles.carousel}>
              {categoryWorks.map((work) => (
                <TransitionLink
                  key={work.id}
                  href={`/works/${work.slug}`}
                  bgColor="var(--yellow-background)"
                  className={styles.imageItem}
                >
                  <div className={styles.imageWrapper}>
                    {work.thumbnail ? (
                      <Image
                        src={work.thumbnail}
                        alt={work.name}
                        width={600}
                        height={400}
                        className={styles.image}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>No Image</div>
                    )}
                  </div>
                  <FadeText>
                    <p>{work.name}</p>
                  </FadeText>
                </TransitionLink>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
