"use client";

import {FormEvent, useState} from "react";
import styles from "./page.module.css";

export default function RequestAJobPage() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      email: formData.get("email"),
      workType: formData.get("workType"),
      inquiry: formData.get("inquiry"),
    };

    try {
      const res = await fetch("/api/send-job-request", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "送信に失敗しました");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "送信に失敗しました",
      );
    }
  }

  if (status === "success") {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.formTitle}>送信完了</h2>
          <p>
            お問い合わせありがとうございます。内容を確認次第、ご連絡いたします。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {status === "error" && <p className={styles.error}>{errorMessage}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
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
            <select
              id="workType"
              name="workType"
              className={styles.select}
              required
              defaultValue=""
            >
              <option value="" disabled>
                選択してください
              </option>
              <option value="デザインを依頼したい">デザインを依頼したい</option>
              <option value="作品や活動のことについて聞きたい">
                作品や活動のことについて聞きたい
              </option>
              <option value="その他のご相談">その他のご相談</option>
            </select>
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

          <button
            type="submit"
            className={styles.submitButton}
            disabled={status === "sending"}
          >
            {status === "sending" ? "送信中..." : "送信"}
          </button>
        </form>
      </div>
    </div>
  );
}
