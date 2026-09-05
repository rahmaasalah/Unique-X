// ============================================================
// 🟢 أسئلة كل وظيفة - نظام Data-driven بدل ما نكتب 8 فورمات منفصلة بالكامل
// كل وظيفة = مجموعة Sections، كل Section فيه عنوان + مجموعة أسئلة
// كل سؤال ليه: id (فريد جوه الوظيفة دي)، label (نص السؤال)، type (شكل الإدخال)، options (لو radio/checkbox)
// ============================================================

export interface JobQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required?: boolean; // افتراضي true إلا لو اتحدد false صراحة
  // 🟢 السؤال ده يبقى إجباري وظاهر بس لو سؤال تاني اتجاوب بقيمة معينة (زي "If yes, ..." اللي بعد سؤال Yes/No)
  dependsOn?: { questionId: string; value: string };
}

export interface JobSection {
  title: string;
  questions: JobQuestion[];
}

// 🟢 قسم "Personal Information" - نفس الأسئلة تقريبًا في كل الوظائف، بس بيتغير خيار Employment Status الرابع أحيانًا
function personalInfoSection(fourthEmploymentOption: 'Student' | 'Other'): JobSection {
  return {
    title: 'Personal Information',
    questions: [
      { id: 'q1', label: 'Full Name', type: 'text' },
      { id: 'q2', label: 'Phone Number', type: 'text' },
      { id: 'q3', label: 'WhatsApp Number', type: 'text' },
      { id: 'q4', label: 'Email Address', type: 'text' },
      { id: 'q5', label: 'Age', type: 'text' },
      { id: 'q6', label: 'Current City / Area', type: 'text' },
      { id: 'q7', label: 'Current Employment Status', type: 'radio', options: ['Employed', 'Unemployed', 'Freelancer', fourthEmploymentOption] },
      { id: 'q8', label: 'How did you hear about this job opportunity?', type: 'text' },
    ]
  };
}

export const JOB_QUESTIONS: { [jobTitle: string]: JobSection[] } = {

  // ============================================================
  'SOCIAL MEDIA SPECIALIST': [
    personalInfoSection('Student'),
    {
      title: 'Professional Experience',
      questions: [
        { id: 'q9', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q10', label: 'How many years of experience do you have in social media?', type: 'text' },
        { id: 'q11', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q12', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q13', label: 'Briefly describe your previous social media experience.', type: 'textarea' },
        { id: 'q14', label: 'Which industries/brands have you managed before?', type: 'textarea' },
        { id: 'q15', label: 'Have you worked with a real estate brand before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q16', label: 'Which platforms have you managed?', type: 'checkbox', options: ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Other'] },
        { id: 'q17', label: 'Please share links to the social media accounts you currently manage or have previously managed.', type: 'textarea' },
      ]
    },
    {
      title: 'Content & Social Media',
      questions: [
        { id: 'q18', label: 'Have you created monthly content calendars before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q19', label: 'How do you decide what type of content a brand should publish?', type: 'textarea' },
        { id: 'q20', label: 'How do you research competitors?', type: 'textarea' },
        { id: 'q21', label: 'How do you identify trends that are relevant to a brand?', type: 'textarea' },
        { id: 'q22', label: 'Which tools/platforms do you use?', type: 'checkbox', options: ['Meta Business Suite', 'Meta Ads Manager', 'Canva', 'CapCut', 'Google Analytics', 'Other'] },
        { id: 'q23', label: 'Which KPIs do you normally monitor for organic social media?', type: 'textarea' },
      ]
    },
    {
      title: 'Lead Generation & Performance Marketing',
      questions: [
        { id: 'q24', label: 'Have you managed lead generation campaigns before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q25', label: 'Which platforms have you run lead generation campaigns on?', type: 'checkbox', options: ['Facebook & Instagram', 'TikTok', 'Google', 'LinkedIn', 'Other'] },
        { id: 'q26', label: 'What was the average monthly advertising budget you personally managed?', type: 'radio', options: ['Less than EGP 20K', 'EGP 20K–50K', 'EGP 50K–100K', 'EGP 100K–250K', 'EGP 250K–500K', 'More than EGP 500K'] },
        { id: 'q27', label: 'What was the highest monthly advertising budget you personally managed? (EGP)', type: 'text' },
        { id: 'q28', label: 'Approximately how many leads were you generating per month?', type: 'text' },
        { id: 'q29', label: 'What was your average CPL (Cost Per Lead)?', type: 'text' },
        { id: 'q30', label: 'What was the lowest CPL you achieved, and for which type of campaign?', type: 'textarea' },
        { id: 'q31', label: 'What percentage of your leads were considered qualified leads?', type: 'radio', options: ['Less than 10%', '10–20%', '20–30%', '30–50%', 'More than 50%', "I don't track this"] },
        { id: 'q32', label: 'How do you define a "qualified lead" in real estate?', type: 'textarea' },
        { id: 'q33', label: 'What was your average Lead → Qualified Lead conversion rate?', type: 'text' },
        { id: 'q34', label: 'What was your average Qualified Lead → Meeting/Viewing conversion rate?', type: 'text' },
        { id: 'q35', label: 'What was your average Lead → Sale conversion rate?', type: 'text' },
        { id: 'q36', label: 'Have you calculated Cost Per Qualified Lead (CPQL) before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q37', label: 'Have you worked with a CRM to track leads from acquisition until closing?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q38', label: 'Which CRM systems have you used?', type: 'text' },
      ]
    },
    {
      title: 'Campaign Management',
      questions: [
        { id: 'q39', label: 'What is the largest campaign budget you have managed for a single campaign?', type: 'text' },
        { id: 'q40', label: 'What was the typical duration of the campaigns you managed?', type: 'radio', options: ['1–7 days', '1–2 weeks', '2–4 weeks', '1–3 months', '3+ months'] },
        { id: 'q41', label: 'How do you decide how to distribute the budget between campaigns?', type: 'textarea' },
        { id: 'q42', label: "How do you decide when to increase or decrease a campaign's budget?", type: 'textarea' },
        { id: 'q43', label: 'When would you stop a campaign?', type: 'textarea' },
        { id: 'q44', label: 'How do you test different audiences?', type: 'textarea' },
        { id: 'q45', label: 'How do you test different creatives?', type: 'textarea' },
        { id: 'q46', label: 'How many creatives would you normally test within one campaign?', type: 'text' },
        { id: 'q47', label: 'How do you determine whether the problem is with the audience, creative, offer, landing page, or sales follow-up?', type: 'textarea' },
      ]
    },
    {
      title: 'Real Estate Performance Scenarios',
      questions: [
        { id: 'q48', label: 'You have an EGP 100,000 monthly budget for a real estate project. Your goal is to generate qualified leads, not just cheap leads. How would you structure and distribute the campaigns?', type: 'textarea' },
        { id: 'q49', label: 'Campaign A: Spend EGP 50,000 / 1,000 Leads / CPL EGP 50 / 50 Qualified. Campaign B: Spend EGP 50,000 / 400 Leads / CPL EGP 125 / 120 Qualified. Which campaign performed better and why?', type: 'textarea' },
        { id: 'q50', label: 'A campaign is generating leads at EGP 70 CPL, but the sales team says most leads are not answering or are not financially qualified. What would you investigate first?', type: 'textarea' },
        { id: 'q51', label: 'Your CPL increased from EGP 100 to EGP 180 over two weeks. What would you check before deciding to change or stop the campaign?', type: 'textarea' },
        { id: 'q52', label: 'You generated 1,000 leads. The sales team contacted all of them. 200 were qualified, 50 booked meetings, and 5 purchased. Calculate: Lead → Qualified Lead, Qualified Lead → Meeting, and Lead → Sale conversion rates.', type: 'textarea' },
        { id: 'q53', label: 'Tell us about the best-performing lead generation campaign you personally managed (objective, platform, audience, duration, budget, leads, CPL, qualified leads, qualified %, sales, cost per sale, and what made it successful).', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q54', label: 'What is your current salary?', type: 'text' },
        { id: 'q55', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q56', label: 'What is your notice period?', type: 'text' },
        { id: 'q57', label: 'When can you start?', type: 'text' },
        { id: 'q58', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q59', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q60', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q61', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'SENIOR PROPERTY CONSULTANT': [
    personalInfoSection('Other'),
    {
      title: 'Professional Experience',
      questions: [
        { id: 'q9', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q10', label: 'How many years of experience do you have in real estate sales?', type: 'text' },
        { id: 'q11', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q12', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q13', label: 'Briefly describe your real estate sales experience.', type: 'textarea' },
        { id: 'q14', label: 'Which real estate companies have you worked with?', type: 'textarea' },
        { id: 'q15', label: 'Which developers have you worked with?', type: 'textarea' },
        { id: 'q16', label: 'Which areas do you have the strongest sales experience in?', type: 'textarea' },
        { id: 'q17', label: 'Which types of real estate have you sold?', type: 'checkbox', options: ['Residential', 'Commercial', 'Administrative', 'Medical', 'Retail', 'Resale', 'North Coast / Vacation', 'Other'] },
      ]
    },
    {
      title: 'Sales Performance',
      questions: [
        { id: 'q18', label: 'What was your average monthly sales target in your previous company?', type: 'text' },
        { id: 'q19', label: 'What was your average monthly sales achievement?', type: 'text' },
        { id: 'q20', label: 'What percentage of your target did you typically achieve?', type: 'text' },
        { id: 'q21', label: 'What was your best monthly sales achievement?', type: 'text' },
        { id: 'q22', label: 'What was your highest-value deal?', type: 'text' },
        { id: 'q23', label: 'How many deals did you close in your best month?', type: 'text' },
        { id: 'q24', label: 'What was your average deal value?', type: 'text' },
        { id: 'q25', label: 'What was your average monthly number of leads?', type: 'text' },
        { id: 'q26', label: 'Approximately what percentage of your leads were qualified?', type: 'text' },
        { id: 'q27', label: 'What was your average Lead → Meeting conversion rate?', type: 'text' },
        { id: 'q28', label: 'What was your average Meeting → Closing conversion rate?', type: 'text' },
        { id: 'q29', label: 'What was your average Lead → Sale conversion rate?', type: 'text' },
        { id: 'q30', label: 'How much of your business came from Company-generated leads / Personal referrals / Self-generated leads / Other (%)?', type: 'textarea' },
        { id: 'q31', label: 'What was your best sales achievement in your career?', type: 'textarea' },
        { id: 'q32', label: 'Please provide any measurable sales achievements you are proud of.', type: 'textarea' },
      ]
    },
    {
      title: 'Lead Management & CRM',
      questions: [
        { id: 'q33', label: 'Which CRM systems have you used?', type: 'text' },
        { id: 'q34', label: 'How many active leads can you usually manage at the same time?', type: 'text' },
        { id: 'q35', label: 'How do you prioritize your leads?', type: 'textarea' },
        { id: 'q36', label: 'How do you qualify a real estate lead?', type: 'textarea' },
        { id: 'q37', label: 'What information do you need from a client before recommending a property?', type: 'textarea' },
        { id: 'q38', label: 'How many follow-ups do you normally make before considering a lead inactive?', type: 'text' },
        { id: 'q39', label: 'How do you organize your follow-ups?', type: 'textarea' },
      ]
    },
    {
      title: 'Market Knowledge',
      questions: [
        { id: 'q40', label: 'Which are the top 5 real estate developers you currently consider strongest in the market?', type: 'textarea' },
        { id: 'q41', label: 'Which areas/projects do you believe currently have the strongest investment potential?', type: 'textarea' },
        { id: 'q42', label: 'What factors do you consider when recommending a property as an investment?', type: 'textarea' },
        { id: 'q43', label: 'How do you compare two projects for a client?', type: 'textarea' },
        { id: 'q44', label: 'How do you stay updated with new launches, price changes, and market offers?', type: 'textarea' },
      ]
    },
    {
      title: 'Negotiation & Closing',
      questions: [
        { id: 'q45', label: 'What is your approach to handling a client who says the price is too high?', type: 'textarea' },
        { id: 'q46', label: 'How do you handle a client who is comparing your project with a competitor?', type: 'textarea' },
        { id: 'q47', label: 'How do you identify whether a client is genuinely ready to buy?', type: 'textarea' },
        { id: 'q48', label: 'What are the most common objections you face in real estate, and how do you handle them?', type: 'textarea' },
        { id: 'q49', label: 'What is your closing technique?', type: 'textarea' },
        { id: 'q50', label: 'Tell us about a difficult deal you successfully closed and how you handled it.', type: 'textarea' },
      ]
    },
    {
      title: 'Practical Scenarios',
      questions: [
        { id: 'q51', label: 'A client has a budget of EGP 7 million but is interested in properties around EGP 10 million. How would you manage the conversation?', type: 'textarea' },
        { id: 'q52', label: 'You have 50 active leads, but only 5 appear highly qualified. How would you prioritize your time?', type: 'textarea' },
        { id: 'q53', label: 'A client is comparing two similar projects and says they will "think about it." What would you do next?', type: 'textarea' },
        { id: 'q54', label: "A client has visited a project, liked the unit, but hasn't booked for two weeks. How would you follow up?", type: 'textarea' },
        { id: 'q55', label: 'You are halfway through the month and have achieved only 30% of your target. What would your action plan be?', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q56', label: 'What is your current salary?', type: 'text' },
        { id: 'q57', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q58', label: 'What is your current commission structure?', type: 'textarea' },
        { id: 'q59', label: 'What was your average monthly commission/income over the last 6 months?', type: 'text' },
        { id: 'q60', label: 'Are you comfortable with a commission-based sales structure?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q61', label: 'What is your notice period?', type: 'text' },
        { id: 'q62', label: 'When can you start?', type: 'text' },
        { id: 'q63', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q64', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q65', label: 'Why are you looking to leave your current/previous company?', type: 'textarea' },
        { id: 'q66', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q67', label: 'What are your career goals for the next 2–3 years?', type: 'textarea' },
        { id: 'q68', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'SENIOR SALES': [
    personalInfoSection('Other'),
    {
      title: 'Professional Experience',
      questions: [
        { id: 'q9', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q10', label: 'How many years of experience do you have in real estate sales?', type: 'text' },
        { id: 'q11', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q12', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q13', label: 'Briefly describe your previous real estate sales experience.', type: 'textarea' },
        { id: 'q14', label: 'Which real estate companies have you worked with?', type: 'textarea' },
        { id: 'q15', label: 'Which developers have you worked with?', type: 'textarea' },
        { id: 'q16', label: 'Which areas do you have the strongest sales experience in?', type: 'textarea' },
        { id: 'q17', label: 'Which property types have you sold?', type: 'checkbox', options: ['Residential', 'Commercial', 'Administrative', 'Medical', 'Retail', 'Resale', 'Vacation / North Coast', 'Other'] },
      ]
    },
    {
      title: 'Sales Performance',
      questions: [
        { id: 'q18', label: 'What was your average monthly sales target in your previous company?', type: 'text' },
        { id: 'q19', label: 'What was your average monthly sales achievement?', type: 'text' },
        { id: 'q20', label: 'What percentage of your target did you typically achieve?', type: 'text' },
        { id: 'q21', label: 'What was your best monthly sales achievement?', type: 'text' },
        { id: 'q22', label: 'What was your highest-value deal?', type: 'text' },
        { id: 'q23', label: 'How many deals did you close in your best month?', type: 'text' },
        { id: 'q24', label: 'What was your average deal value?', type: 'text' },
        { id: 'q25', label: 'Approximately how many leads did you receive per month?', type: 'text' },
        { id: 'q26', label: 'Approximately how many leads did you personally generate per month?', type: 'text' },
        { id: 'q27', label: 'What percentage of your business came from Company-generated / Self-generated / Referrals / Other?', type: 'textarea' },
        { id: 'q28', label: 'What was your average Lead → Meeting conversion rate?', type: 'text' },
        { id: 'q29', label: 'What was your average Meeting → Closing conversion rate?', type: 'text' },
        { id: 'q30', label: 'What was your average Lead → Sale conversion rate?', type: 'text' },
        { id: 'q31', label: 'What was your average monthly revenue generated?', type: 'text' },
        { id: 'q32', label: 'What was your biggest sales achievement?', type: 'textarea' },
      ]
    },
    {
      title: 'Lead Management & Closing',
      questions: [
        { id: 'q33', label: 'Which CRM systems have you used?', type: 'text' },
        { id: 'q34', label: 'How do you qualify a real estate lead?', type: 'textarea' },
        { id: 'q35', label: 'How do you prioritize your leads?', type: 'textarea' },
        { id: 'q36', label: 'How many active leads can you normally manage at the same time?', type: 'text' },
        { id: 'q37', label: 'How do you organize your daily follow-ups?', type: 'textarea' },
        { id: 'q38', label: 'How do you identify whether a client is genuinely ready to buy?', type: 'textarea' },
        { id: 'q39', label: 'What are the most common objections you face, and how do you handle them?', type: 'textarea' },
        { id: 'q40', label: 'What is your approach to closing a deal?', type: 'textarea' },
        { id: 'q41', label: 'Tell us about the most difficult deal you successfully closed.', type: 'textarea' },
      ]
    },
    {
      title: 'Market Knowledge',
      questions: [
        { id: 'q42', label: 'Which 5 real estate developers do you consider strongest in the current market?', type: 'textarea' },
        { id: 'q43', label: 'Which areas do you believe currently have strong sales/investment potential?', type: 'textarea' },
        { id: 'q44', label: 'How do you stay updated on new launches, price changes, and market offers?', type: 'textarea' },
        { id: 'q45', label: 'How do you compare two competing projects for a client?', type: 'textarea' },
      ]
    },
    {
      title: 'Practical Scenarios',
      questions: [
        { id: 'q46', label: 'A client has EGP 7 million but wants a property worth EGP 10 million. How would you manage the conversation?', type: 'textarea' },
        { id: 'q47', label: 'A client is comparing your project with a competitor offering a lower price. How would you handle the objection?', type: 'textarea' },
        { id: 'q48', label: 'A qualified client has visited the project, likes the unit, but has not booked for two weeks. What would you do?', type: 'textarea' },
        { id: 'q49', label: 'You are halfway through the month and have achieved only 30% of your target. What would your action plan be?', type: 'textarea' },
        { id: 'q50', label: 'You have 40 active leads but only 5 are highly qualified. How would you prioritize your time?', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q51', label: 'What is your current salary?', type: 'text' },
        { id: 'q52', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q53', label: 'What is your current commission structure?', type: 'textarea' },
        { id: 'q54', label: 'What was your average monthly commission/income over the last 6 months?', type: 'text' },
        { id: 'q55', label: 'Are you comfortable with a commission-based sales structure?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q56', label: 'What is your notice period?', type: 'text' },
        { id: 'q57', label: 'When can you start?', type: 'text' },
        { id: 'q58', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q59', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q60', label: 'Why are you looking to leave your current/previous company?', type: 'textarea' },
        { id: 'q61', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q62', label: 'What are your career goals for the next 2–3 years?', type: 'textarea' },
        { id: 'q63', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'REEL MAKER / VIDEO CONTENT CREATOR': [
    personalInfoSection('Student'),
    {
      title: 'Professional Experience',
      questions: [
        { id: 'q9', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q10', label: 'How many years of experience do you have in video/content creation?', type: 'text' },
        { id: 'q11', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q12', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q13', label: 'Briefly describe your previous experience in content creation.', type: 'textarea' },
        { id: 'q14', label: 'Have you created real estate content before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q15', label: 'If yes, please mention the real estate brands/projects you have worked with.', type: 'textarea', dependsOn: { questionId: 'q14', value: 'Yes' } },
        { id: 'q16', label: 'Which platforms have you created content for?', type: 'checkbox', options: ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'Other'] },
        { id: 'q17', label: 'Please share your portfolio / previous work links.', type: 'textarea' },
      ]
    },
    {
      title: 'Technical Skills',
      questions: [
        { id: 'q18', label: 'Which editing software do you use?', type: 'checkbox', options: ['CapCut', 'Premiere Pro', 'After Effects', 'Final Cut', 'Other'] },
        { id: 'q19', label: 'How would you rate your video editing skills?', type: 'radio', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
        { id: 'q20', label: 'Can you shoot professional videos using a mobile phone?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q21', label: 'Do you have your own equipment?', type: 'checkbox', options: ['Smartphone', 'Camera', 'Gimbal', 'Microphone', 'Lighting', 'Other', 'None'] },
        { id: 'q22', label: 'How many Reels can you realistically produce/edit per week?', type: 'text' },
      ]
    },
    {
      title: 'Creative Skills',
      questions: [
        { id: 'q23', label: 'How do you come up with a strong hook for a Reel?', type: 'textarea' },
        { id: 'q24', label: 'What makes someone watch a Reel until the end, in your opinion?', type: 'textarea' },
        { id: 'q25', label: 'How would you turn a property with basic visuals into an engaging Reel?', type: 'textarea' },
        { id: 'q26', label: 'How do you keep up with TikTok and Instagram trends?', type: 'textarea' },
        { id: 'q27', label: 'Share one Reel/video you created that performed particularly well and explain why you think it performed well.', type: 'textarea' },
      ]
    },
    {
      title: 'Practical Scenarios',
      questions: [
        { id: 'q28', label: 'We give you a video of an empty apartment with no furniture and no attractive view. How would you turn it into an engaging Reel?', type: 'textarea' },
        { id: 'q29', label: 'We are launching a new real estate project. Give us 3 different Reel ideas for the launch.', type: 'textarea' },
        { id: 'q30', label: 'A Reel has very good production quality but gets very low views. What would you analyze or change?', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q31', label: 'What is your current salary?', type: 'text' },
        { id: 'q32', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q33', label: 'What is your notice period?', type: 'text' },
        { id: 'q34', label: 'When can you start?', type: 'text' },
        { id: 'q35', label: 'Are you available to shoot content on-site at different locations?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q36', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q37', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q38', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'HR SPECIALIST': [
    personalInfoSection('Student'),
    {
      title: 'Professional Experience',
      questions: [
        { id: 'q9', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q10', label: 'How many years of HR experience do you have?', type: 'text' },
        { id: 'q11', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q12', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q13', label: 'Briefly describe your previous HR experience.', type: 'textarea' },
        { id: 'q14', label: 'Which areas of HR have you worked in?', type: 'checkbox', options: ['Recruitment', 'Payroll', 'Attendance', 'Employee Relations', 'Performance Management', 'Training & Development', 'Policies & Procedures', 'Other'] },
        { id: 'q15', label: 'Approximately how many employees have you managed HR operations for?', type: 'text' },
        { id: 'q16', label: 'Have you recruited sales employees before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q17', label: 'Approximately how many employees have you recruited in your previous roles?', type: 'text' },
        { id: 'q18', label: 'Which recruitment platforms/tools have you used?', type: 'textarea' },
        { id: 'q19', label: 'Which HR systems/software have you used?', type: 'textarea' },
      ]
    },
    {
      title: 'Recruitment & HR Management',
      questions: [
        { id: 'q20', label: 'Describe your recruitment process from receiving a CV until hiring.', type: 'textarea' },
        { id: 'q21', label: 'How do you evaluate whether a candidate is suitable for a real estate sales position?', type: 'textarea' },
        { id: 'q22', label: 'How do you measure recruitment performance?', type: 'textarea' },
        { id: 'q23', label: 'How do you handle an employee during their probation period?', type: 'textarea' },
        { id: 'q24', label: 'How do you deal with an employee who consistently underperforms?', type: 'textarea' },
        { id: 'q25', label: 'How do you handle conflicts between employees?', type: 'textarea' },
        { id: 'q26', label: 'How do you maintain employee engagement and motivation?', type: 'textarea' },
        { id: 'q27', label: 'Have you created or implemented HR policies before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q28', label: 'Have you handled attendance, leave, and payroll processes?', type: 'radio', options: ['Yes', 'No'] },
      ]
    },
    {
      title: 'Practical Scenarios',
      questions: [
        { id: 'q29', label: 'A sales employee is achieving excellent numbers but frequently violates company policies. How would you handle the situation?', type: 'textarea' },
        { id: 'q30', label: 'A manager wants to hire a candidate who you believe is not suitable for the position. What would you do?', type: 'textarea' },
        { id: 'q31', label: 'You have 10 open positions and need to hire quickly. How would you organize your recruitment process?', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q32', label: 'What is your current salary?', type: 'text' },
        { id: 'q33', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q34', label: 'What is your notice period?', type: 'text' },
        { id: 'q35', label: 'When can you start?', type: 'text' },
        { id: 'q36', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q37', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q38', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'SALES TEAM LEADER': [
    personalInfoSection('Student'),
    {
      title: 'Professional Experience',
      questions: [
        { id: 'q9', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q10', label: 'How many years of experience do you have in real estate sales?', type: 'text' },
        { id: 'q11', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q12', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q13', label: 'Briefly describe your previous experience in real estate sales.', type: 'textarea' },
        { id: 'q14', label: 'Have you managed a sales team before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q15', label: 'If yes, how many sales agents were you responsible for?', type: 'text', dependsOn: { questionId: 'q14', value: 'Yes' } },
        { id: 'q16', label: "What was your team's average monthly sales target?", type: 'text' },
        { id: 'q17', label: "What was your team's best sales achievement?", type: 'textarea' },
        { id: 'q18', label: 'What was your personal best sales achievement?', type: 'textarea' },
        { id: 'q19', label: 'Which real estate developers/projects have you worked with?', type: 'textarea' },
        { id: 'q20', label: 'Which areas/markets do you have experience selling in?', type: 'textarea' },
      ]
    },
    {
      title: 'Sales Management',
      questions: [
        { id: 'q21', label: 'How do you distribute and manage leads among your sales team?', type: 'textarea' },
        { id: 'q22', label: "How do you monitor your team's daily performance?", type: 'textarea' },
        { id: 'q23', label: 'Which sales KPIs do you normally track?', type: 'textarea' },
        { id: 'q24', label: 'What CRM systems have you used?', type: 'text' },
        { id: 'q25', label: 'How do you deal with an underperforming sales agent?', type: 'textarea' },
        { id: 'q26', label: 'How do you motivate your team to achieve targets?', type: 'textarea' },
        { id: 'q27', label: 'How do you handle a sales agent who has good sales numbers but poor discipline?', type: 'textarea' },
        { id: 'q28', label: 'How do you support your team during difficult negotiations or closing stages?', type: 'textarea' },
      ]
    },
    {
      title: 'Practical Scenarios',
      questions: [
        { id: 'q29', label: 'One of your agents has received 100 leads but has only contacted 40 of them. The agent says the leads are poor quality. What would you do?', type: 'textarea' },
        { id: 'q30', label: 'Your team is achieving only 60% of its monthly target with 10 days remaining. What actions would you take?', type: 'textarea' },
        { id: 'q31', label: 'What are the three most important KPIs for a successful real estate sales team, and why?', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q32', label: 'What is your current salary?', type: 'text' },
        { id: 'q33', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q34', label: 'What is your notice period?', type: 'text' },
        { id: 'q35', label: 'When can you start?', type: 'text' },
        { id: 'q36', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q37', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q38', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q39', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'JUNIOR PROPERTY CONSULTANT': [
    personalInfoSection('Student'),
    {
      title: 'Education & Experience',
      questions: [
        { id: 'q9', label: 'What is your highest level of education?', type: 'text' },
        { id: 'q10', label: 'University / College', type: 'text' },
        { id: 'q11', label: 'Graduation Year', type: 'text' },
        { id: 'q12', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q13', label: 'Do you have previous sales experience?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q14', label: 'If yes, how many years of sales experience do you have?', type: 'text', dependsOn: { questionId: 'q13', value: 'Yes' } },
        { id: 'q15', label: 'Do you have previous real estate experience?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q16', label: 'If yes, how many years/months of real estate experience do you have?', type: 'text', dependsOn: { questionId: 'q15', value: 'Yes' } },
        { id: 'q17', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q18', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q19', label: 'Briefly describe your previous sales/work experience.', type: 'textarea' },
      ]
    },
    {
      title: 'Sales Skills',
      questions: [
        { id: 'q20', label: 'Have you worked with leads before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q21', label: 'Have you worked with a CRM before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q22', label: 'If yes, which CRM system did you use?', type: 'text', dependsOn: { questionId: 'q21', value: 'Yes' } },
        { id: 'q23', label: 'How comfortable are you making cold calls?', type: 'radio', options: ['Not comfortable', 'Somewhat comfortable', 'Comfortable', 'Very comfortable'] },
        { id: 'q24', label: 'How would you rate your communication skills?', type: 'radio', options: ['Beginner', 'Intermediate', 'Advanced', 'Excellent'] },
        { id: 'q25', label: 'How would you rate your negotiation skills?', type: 'radio', options: ['Beginner', 'Intermediate', 'Advanced', 'Excellent'] },
        { id: 'q26', label: 'How would you rate your ability to handle rejection?', type: 'radio', options: ['Low', 'Average', 'Good', 'Excellent'] },
        { id: 'q27', label: 'Have you worked with monthly sales targets before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q28', label: 'If yes, what was your previous monthly target?', type: 'text', dependsOn: { questionId: 'q27', value: 'Yes' } },
        { id: 'q29', label: 'What was your best sales achievement?', type: 'textarea' },
      ]
    },
    {
      title: 'Real Estate Knowledge',
      questions: [
        { id: 'q30', label: 'Which areas of the Egyptian real estate market are you familiar with?', type: 'textarea' },
        { id: 'q31', label: 'Which real estate projects/developers do you know?', type: 'textarea' },
        { id: 'q32', label: 'Do you have knowledge of:', type: 'checkbox', options: ['Primary / Developer Sales', 'Resale', 'Commercial', 'Administrative', 'Residential', 'Vacation / North Coast', 'Investment properties'] },
        { id: 'q33', label: 'Which type of real estate are you most interested in selling and why?', type: 'textarea' },
      ]
    },
    {
      title: 'Practical Sales Questions',
      questions: [
        { id: 'q34', label: '"I\'m just looking around and I\'m not ready to buy." How would you respond?', type: 'textarea' },
        { id: 'q35', label: 'A client says: "Your price is too high." How would you handle the objection?', type: 'textarea' },
        { id: 'q36', label: 'A client stops responding after showing interest in a property. What would you do?', type: 'textarea' },
        { id: 'q37', label: 'A client gives you a budget of EGP 5 million but wants a property worth EGP 8 million. How would you handle the situation?', type: 'textarea' },
        { id: 'q38', label: 'What questions would you ask a new client before recommending a property?', type: 'textarea' },
        { id: 'q39', label: 'What do you think makes a successful property consultant?', type: 'textarea' },
      ]
    },
    {
      title: 'Availability & Expectations',
      questions: [
        { id: 'q40', label: 'What is your current salary? (if applicable)', type: 'text', required: false },
        { id: 'q41', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q42', label: 'Are you comfortable with a commission-based sales structure?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q43', label: 'What is your notice period?', type: 'text' },
        { id: 'q44', label: 'When can you start?', type: 'text' },
        { id: 'q45', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q46', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q47', label: 'Why do you want to build a career in real estate?', type: 'textarea' },
        { id: 'q48', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q49', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'PROPERTY ADVISOR': [
    personalInfoSection('Other'),
    {
      title: 'Professional Experience',
      questions: [
        { id: 'q9', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q10', label: 'How many years of experience do you have in real estate?', type: 'text' },
        { id: 'q11', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q12', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q13', label: 'Briefly describe your previous real estate experience.', type: 'textarea' },
        { id: 'q14', label: 'Which real estate developers have you worked with?', type: 'textarea' },
        { id: 'q15', label: 'Which areas/projects do you have the strongest experience in?', type: 'textarea' },
        { id: 'q16', label: 'What types of properties have you sold?', type: 'checkbox', options: ['Residential', 'Commercial', 'Administrative', 'Medical', 'Retail', 'Resale', 'Vacation / North Coast', 'Other'] },
      ]
    },
    {
      title: 'Sales Performance',
      questions: [
        { id: 'q17', label: 'What was your average monthly sales target?', type: 'text' },
        { id: 'q18', label: 'What was your average monthly sales achievement?', type: 'text' },
        { id: 'q19', label: 'What was your best monthly sales achievement?', type: 'text' },
        { id: 'q20', label: 'What was the highest-value property/deal you closed?', type: 'text' },
        { id: 'q21', label: 'How many deals did you close in your best month?', type: 'text' },
        { id: 'q22', label: 'What was your average deal value?', type: 'text' },
        { id: 'q23', label: 'Approximately how many leads did you handle per month?', type: 'text' },
        { id: 'q24', label: 'Approximately what percentage of your leads were qualified?', type: 'text' },
        { id: 'q25', label: 'What was your average Lead → Meeting conversion rate?', type: 'text' },
        { id: 'q26', label: 'What was your average Meeting → Sale conversion rate?', type: 'text' },
        { id: 'q27', label: 'What percentage of your sales came from company-generated leads vs. your own network/referrals?', type: 'text' },
        { id: 'q28', label: 'What was your biggest sales achievement and why are you proud of it?', type: 'textarea' },
      ]
    },
    {
      title: 'Advisory & Client Handling',
      questions: [
        { id: 'q29', label: "How do you identify a client's real needs before recommending a property?", type: 'textarea' },
        { id: 'q30', label: 'What information do you need from a client before making a recommendation?', type: 'textarea' },
        { id: 'q31', label: 'How do you decide whether a property is suitable for an investor?', type: 'textarea' },
        { id: 'q32', label: 'How do you compare two projects for a client?', type: 'textarea' },
        { id: 'q33', label: 'How do you explain the difference between a good property and a good investment?', type: 'textarea' },
        { id: 'q34', label: 'How do you handle a client who wants the "best investment" without giving you a clear budget or objective?', type: 'textarea' },
        { id: 'q35', label: 'What factors do you consider when advising a client to buy now versus wait?', type: 'textarea' },
      ]
    },
    {
      title: 'Practical Scenarios',
      questions: [
        { id: 'q36', label: 'A client has EGP 5 million and wants the highest possible investment return. What questions would you ask before recommending a property?', type: 'textarea' },
        { id: 'q37', label: 'A client is interested in two projects with similar prices. How would you help them make the decision?', type: 'textarea' },
        { id: 'q38', label: 'A client says, "I found a cheaper unit directly from the developer." How would you respond?', type: 'textarea' },
        { id: 'q39', label: 'A client likes the property but says, "I need to think about it." How would you handle the follow-up?', type: 'textarea' },
        { id: 'q40', label: 'A client wants a property that is outside their budget. How would you manage the conversation without losing the client?', type: 'textarea' },
      ]
    },
    {
      title: 'CRM & Follow-up',
      questions: [
        { id: 'q41', label: 'Which CRM systems have you used?', type: 'text' },
        { id: 'q42', label: 'How do you organize your daily follow-ups?', type: 'textarea' },
        { id: 'q43', label: 'How do you prioritize your leads?', type: 'textarea' },
        { id: 'q44', label: 'How many follow-ups do you normally make before considering a lead inactive?', type: 'text' },
        { id: 'q45', label: 'How do you keep track of clients who are not ready to buy immediately?', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q46', label: 'What is your current salary?', type: 'text' },
        { id: 'q47', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q48', label: 'What is your current commission structure?', type: 'textarea' },
        { id: 'q49', label: 'What was your average monthly commission/income over the last 6 months?', type: 'text' },
        { id: 'q50', label: 'Are you comfortable with a commission-based sales structure?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q51', label: 'What is your notice period?', type: 'text' },
        { id: 'q52', label: 'When can you start?', type: 'text' },
        { id: 'q53', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q54', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q55', label: 'Why are you looking to leave your current/previous company?', type: 'textarea' },
        { id: 'q56', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q57', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

  // ============================================================
  'SALES ADMIN': [
    personalInfoSection('Other'),
    {
      title: 'Education & Professional Experience',
      questions: [
        { id: 'q9', label: 'What is your highest level of education?', type: 'text' },
        { id: 'q10', label: 'University / College', type: 'text' },
        { id: 'q11', label: 'Graduation Year', type: 'text' },
        { id: 'q12', label: 'How many years of total work experience do you have?', type: 'text' },
        { id: 'q13', label: 'How many years of experience do you have in real estate?', type: 'text' },
        { id: 'q14', label: 'How many years of experience do you have in Sales Administration / Sales Coordination?', type: 'text' },
        { id: 'q15', label: 'What is your current/most recent job title?', type: 'text' },
        { id: 'q16', label: 'What is/was your current/most recent company?', type: 'text' },
        { id: 'q17', label: 'Briefly describe your previous experience in real estate.', type: 'textarea' },
        { id: 'q18', label: 'Which real estate companies/developers have you worked with?', type: 'textarea' },
        { id: 'q19', label: 'Which areas of the Egyptian real estate market are you familiar with?', type: 'textarea' },
      ]
    },
    {
      title: 'Sales Administration Experience',
      questions: [
        { id: 'q20', label: 'Which responsibilities have you handled before?', type: 'checkbox', options: ['CRM Management', 'Lead Management', 'Sales Reports', 'Reservation Processing', 'Contract Follow-up', 'Commission Tracking', 'Developer Coordination', 'Unit Availability', 'Price Lists', 'Payment Plans', 'Client Documentation', 'Sales Team Support', 'Other'] },
        { id: 'q21', label: 'Have you worked directly with real estate developers?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q22', label: 'If yes, which developers have you dealt with?', type: 'textarea', dependsOn: { questionId: 'q21', value: 'Yes' } },
        { id: 'q23', label: 'Have you handled property reservations/bookings before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q24', label: 'Have you followed up on contracts and client documentation?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q25', label: 'Have you handled sales commission tracking?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q26', label: 'Have you prepared daily/weekly/monthly sales reports?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q27', label: 'Have you worked with a CRM system?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q28', label: 'Which CRM systems have you used?', type: 'text' },
      ]
    },
    {
      title: 'Excel & Reporting Skills',
      questions: [
        { id: 'q29', label: 'How would you rate your Microsoft Excel / Google Sheets skills?', type: 'radio', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
        { id: 'q30', label: 'Which Excel functions/tools can you use?', type: 'checkbox', options: ['SUM', 'COUNT / COUNTIF', 'IF', 'VLOOKUP / XLOOKUP', 'Pivot Tables', 'Filters & Sorting', 'Conditional Formatting', 'Other'] },
        { id: 'q31', label: 'Have you created sales reports or dashboards before?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q32', label: 'If yes, briefly describe the reports you created.', type: 'textarea', dependsOn: { questionId: 'q31', value: 'Yes' } },
      ]
    },
    {
      title: 'Real Estate Knowledge',
      questions: [
        { id: 'q33', label: 'How familiar are you with the following?', type: 'checkbox', options: ['Primary / Developer Sales', 'Resale', 'Residential', 'Commercial', 'Administrative', 'Medical', 'North Coast / Vacation Properties'] },
        { id: 'q34', label: 'How do you make sure that the sales team is working with the latest prices and availability?', type: 'textarea' },
        { id: 'q35', label: 'What information should be checked before confirming a unit reservation?', type: 'textarea' },
        { id: 'q36', label: 'What documents are usually required from a client during a real estate booking?', type: 'textarea' },
      ]
    },
    {
      title: 'Practical Scenarios',
      questions: [
        { id: 'q37', label: "A sales consultant tells you that a unit is available, but the developer's latest availability sheet shows it as sold. What would you do?", type: 'textarea' },
        { id: 'q38', label: "A consultant has completed a sale but several required documents are missing. The developer's deadline is today. How would you handle the situation?", type: 'textarea' },
        { id: 'q39', label: 'A sales agent enters incorrect client or deal information into the CRM. You discover the mistake after the report has already been sent to management. What would you do?', type: 'textarea' },
        { id: 'q40', label: 'You have 10 pending reservations, 5 contracts waiting for documents, and the sales manager needs an urgent report. How would you prioritize your tasks?', type: 'textarea' },
        { id: 'q41', label: 'A developer sends a new price list and payment plan. What steps would you take before sharing the information with the sales team?', type: 'textarea' },
        { id: 'q42', label: "A sales consultant asks you about their commission, but the developer's commission statement does not match your records. How would you investigate the difference?", type: 'textarea' },
      ]
    },
    {
      title: 'Organization & Work Style',
      questions: [
        { id: 'q43', label: 'How do you organize and prioritize your daily tasks?', type: 'textarea' },
        { id: 'q44', label: "How do you make sure you don't miss deadlines or follow-ups?", type: 'textarea' },
        { id: 'q45', label: 'How do you handle repetitive administrative tasks while maintaining accuracy?', type: 'textarea' },
        { id: 'q46', label: 'How do you handle working under pressure when several sales consultants need your support at the same time?', type: 'textarea' },
        { id: 'q47', label: 'What do you consider more important in Sales Administration: speed or accuracy? Why?', type: 'textarea' },
      ]
    },
    {
      title: 'Salary & Availability',
      questions: [
        { id: 'q48', label: 'What is your current salary?', type: 'text' },
        { id: 'q49', label: 'What are your salary expectations?', type: 'text' },
        { id: 'q50', label: 'What is your notice period?', type: 'text' },
        { id: 'q51', label: 'When can you start?', type: 'text' },
        { id: 'q52', label: 'Are you available to work from the office?', type: 'radio', options: ['Yes', 'No', 'Hybrid preferred'] },
        { id: 'q53', label: 'Are you willing to work occasional weekends/events when required?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'q54', label: 'Why are you looking to leave your current/previous company?', type: 'textarea' },
        { id: 'q55', label: 'Why do you want to join our company?', type: 'textarea' },
        { id: 'q56', label: 'What makes you the right candidate for this position?', type: 'textarea' },
      ]
    }
  ],

};

// 🟢 اللي بينادي عليها الكومبوننت - بترجع أسئلة الوظيفة دي، أو null لو الوظيفة مش من ضمن الـ 8 (بيرجعله الفورم القديمة كـ fallback)
export function getJobQuestions(jobTitle: string): JobSection[] | null {
  const key = Object.keys(JOB_QUESTIONS).find(k => k.toLowerCase() === (jobTitle || '').trim().toLowerCase());
  return key ? JOB_QUESTIONS[key] : null;
}