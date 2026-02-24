import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <small className={styles.copyright}>©︎{year} Muraoka Hikaru</small>
    </footer>
  );
}
