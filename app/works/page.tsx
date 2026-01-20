import Image from "next/image";
import Link from "next/link";
import { getWorks } from "../../lib/notion";
import styles from "./page.module.css";

interface WorksPageProps {
  searchParams: Promise<{ category?: string }>;
}

interface CategoryInfo {
  param: string; // クエリパラメータ用（英語）
  display: string; // 表示用（日本語 + 英語）
  search: string; // 検索用（日本語のみ）
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

export default async function WorksPage({ searchParams }: WorksPageProps) {
  const params = await searchParams;
  // クエリパラメータがない場合、デフォルトで「伝えるものをつくる」を選択
  const selectedCategoryParam = params.category || "visual-communication";
  const works = await getWorks();
  
  // クエリパラメータから日本語カテゴリ名を取得
  const selectedCategoryInfo = CATEGORIES.find(
    (cat) => cat.param === selectedCategoryParam
  ) || CATEGORIES[0]; // 見つからない場合もデフォルトで最初のカテゴリを使用
  const searchCategory = selectedCategoryInfo.search;
  
  // カテゴリでフィルタリング（日本語カテゴリ名で検索）
  const filteredWorks = works.filter(
    (work) => work.category === searchCategory
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {CATEGORIES.map((category) => {
          const isActive = selectedCategoryParam === category.param;
          const href = isActive
            ? "/works"
            : `/works?category=${category.param}`;
          return (
            <Link
              key={category.param}
              href={href}
              className={isActive ? styles.active : styles.inactive}
            >
              {category.display}
            </Link>
          );
        })}
      </div>
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.imageGrid}>
            {filteredWorks.map((work) => (
              <Link
                key={work.id}
                href={`/works/${work.slug}`}
                className={styles.imageItem}
              >
                <div className={styles.imageWrapper}>
                  {work.thumbnail ? (
                    <Image
                      src={work.thumbnail}
                      alt={work.name}
                      width={1200}
                      height={800}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      No Image
                    </div>
                  )}
                </div>
                <div className={styles.textContent}>
                  <p>{work.name}</p>
                  {work.activity_period && (
                    <p>{work.activity_period}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
