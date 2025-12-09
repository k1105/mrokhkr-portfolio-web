"use client";

import HeaderImage from "../components/HeaderImage";
import styles from "./page.module.css";

export default function RequestAJobPage() {
  return (
    <div className={styles.container}>
      <HeaderImage
        src="/header/header_request_a_job.svg"
        alt="Contact Header"
      />
      <div className={styles.content}>
        <h2 className={styles.formTitle}>お問い合わせフォーム</h2>

        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              お名前
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="workType" className={styles.label}>
              お仕事の種類
            </label>
            <input
              type="text"
              id="workType"
              name="workType"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="inquiry" className={styles.label}>
              お問い合わせ内容
            </label>
            <textarea
              id="inquiry"
              name="inquiry"
              rows={6}
              className={styles.textarea}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            送信
          </button>
        </form>
      </div>
    </div>
  );
}
