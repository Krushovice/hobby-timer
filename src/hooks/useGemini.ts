import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = 'gemini-2.5-flash'

function getModel(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL })
}

function stripJsonFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
}

export async function generateOnboardingQuestions(apiKey: string): Promise<string[]> {
  const model = getModel(apiKey)
  const result = await model.generateContent(
    `Ты психолог-аналитик цифрового поведения. Сгенерируй ровно 8 вопросов на русском языке для онбординга приложения, которое отслеживает время в Chrome/YouTube и помогает делать перерывы.

Вопросы должны помочь определить тип пользователя: ESCAPIST (уходит от реальности), PROCRASTINATOR (откладывает дела), INFO-ADDICT (информационная зависимость), DOPAMINE-SEEKER (ищет дофамин).

Вопросы должны быть личными, конкретными и немного провокационными. Касаются: привычек в интернете, что делаешь когда скучно/тревожно, реальные хобби, что хотел бы делать вместо YouTube.

Верни ТОЛЬКО JSON-массив строк, без объяснений:
["вопрос 1", "вопрос 2", ...]`
  )
  return JSON.parse(stripJsonFences(result.response.text())) as string[]
}

export interface ProfileAnalysis {
  type: 'ESCAPIST' | 'PROCRASTINATOR' | 'INFO-ADDICT' | 'DOPAMINE-SEEKER'
  summary: string
  hobbies: { name: string; category: string }[]
}

export async function analyzeProfile(
  apiKey: string,
  qa: { question: string; answer: string }[]
): Promise<ProfileAnalysis> {
  const model = getModel(apiKey)
  const qaText = qa.map((item, i) => `${i + 1}. ${item.question}\nОтвет: ${item.answer}`).join('\n\n')

  const result = await model.generateContent(
    `Ты психолог-аналитик цифрового поведения. Проанализируй ответы пользователя на вопросы онбординга.

ОТВЕТЫ ПОЛЬЗОВАТЕЛЯ:
${qaText}

Определи:
1. Тип пользователя (ОДИН из): ESCAPIST | PROCRASTINATOR | INFO-ADDICT | DOPAMINE-SEEKER
2. Краткое описание профиля на русском (2-3 предложения, честно и немного провокационно)
3. Список из 5-8 реальных хобби/активностей, которые подойдут этому человеку вместо YouTube, с категорией

Категории хобби: спорт | творчество | обучение | прогулка | другое

Верни ТОЛЬКО валидный JSON без объяснений:
{
  "type": "ESCAPIST",
  "summary": "...",
  "hobbies": [
    {"name": "Пробежка в парке", "category": "спорт"}
  ]
}`
  )
  return JSON.parse(stripJsonFences(result.response.text())) as ProfileAnalysis
}

export async function getSuggestion(
  apiKey: string,
  profileType: string,
  profileSummary: string,
  hobby: string
): Promise<string> {
  const model = getModel(apiKey)
  const result = await model.generateContent(
    `Ты личный коуч. Пользователь типа ${profileType} (${profileSummary}) слишком долго сидит в Chrome/YouTube. Напиши ОДНО мотивирующее сообщение на русском (макс 120 символов), призывающее сделать перерыв и заняться: ${hobby}. Только текст, без кавычек.`
  )
  return result.response.text().trim()
}
