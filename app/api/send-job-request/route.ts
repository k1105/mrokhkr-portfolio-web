import {NextResponse} from "next/server";
import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const {name, email, workType, inquiry} = await request.json();

    if (!name || !email || !workType || !inquiry) {
      return NextResponse.json(
        {error: "すべての項目を入力してください"},
        {status: 400},
      );
    }

    const {error} = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "hikarumuraoka.968@gmail.com",
      subject: `【お仕事依頼】${name}さんからのお問い合わせ`,
      text: [
        `お名前: ${name}`,
        `メールアドレス: ${email}`,
        `お仕事の種類: ${workType}`,
        ``,
        `お問い合わせ内容:`,
        inquiry,
      ].join("\n"),
    });

    if (error) {
      return NextResponse.json(
        {error: "メールの送信に失敗しました"},
        {status: 500},
      );
    }

    return NextResponse.json({success: true});
  } catch {
    return NextResponse.json(
      {error: "メールの送信に失敗しました"},
      {status: 500},
    );
  }
}
