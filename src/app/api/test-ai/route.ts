import { NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google" // Changed from OpenAI to Google

export async function GET() {
  try {
    const { text } = await generateText({
      model: google("gemini-1.5-flash"), // Changed from OpenAI to Google Gemini
      prompt: "Say hello and confirm that the AI SDK is working properly with Google Gemini.",
    })

    return NextResponse.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AI SDK test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
