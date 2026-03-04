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
          <div className={styles.header}>
            <h1 className={`${styles.title} global-text-lg`}>
              お問い合わせフォーム
            </h1>
          </div>
          <div className={styles.contentWrapper}>
            <p className="global-text-md">
              送信完了しました。 <br />
              <br />
              いただいた内容を確認のうえ、返信いたします。
              <br />
              しばらくお待ちください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={`${styles.title} global-text-lg`}>
            お問い合わせフォーム
          </h1>
        </div>

        <div className={styles.contentWrapper}>
          {status === "error" && (
            <p className={`${styles.error} global-text-md`}>{errorMessage}</p>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label
                htmlFor="name"
                className={`${styles.label} global-text-md`}
              >
                お名前
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`${styles.input} global-text-md`}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label
                htmlFor="email"
                className={`${styles.label} global-text-md`}
              >
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`${styles.input} global-text-md`}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label
                htmlFor="workType"
                className={`${styles.label} global-text-md`}
              >
                お仕事の種類
              </label>
              <select
                id="workType"
                name="workType"
                className={`${styles.select} global-text-md`}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  選択してください
                </option>
                <option value="デザインを依頼したい">
                  デザインを依頼したい
                </option>
                <option value="作品や活動のことについて聞きたい">
                  作品や活動のことについて聞きたい
                </option>
                <option value="その他のご相談">その他のご相談</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label
                htmlFor="inquiry"
                className={`${styles.label} global-text-md`}
              >
                お問い合わせ内容
              </label>
              <textarea
                id="inquiry"
                name="inquiry"
                rows={6}
                className={`${styles.textarea} global-text-md`}
                required
              />
            </div>

            <button
              type="submit"
              className={`${styles.submitButton} global-text-md`}
              disabled={status === "sending"}
            >
              {status === "sending" ? "送信中..." : "送信"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
