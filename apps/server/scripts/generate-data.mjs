import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function runGemini(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn('gemini', ['-p', prompt], { encoding: 'utf-8' });
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data;
    });

    child.stderr.on('data', (data) => {
      error += data;
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Gemini exited with code ${code}: ${error}`));
      }
    });
  });
}

async function generateData() {
  console.log('📊 Generating test data from Gemini CLI...\n');

  try {
    // Generate mentors
    console.log('👨‍🏫 Generating mentor profiles...');
    const mentorsPrompt = `Generate 15 realistic tech mentor profiles as a VALID JSON array (no markdown, no backticks, just pure JSON). Each person should have: firstName, lastName, email (format: mentor1@mentorship.test through mentor15@mentorship.test), headline (professional title), expertise (array of 2-5 skills), hourlyRate (number 50-200), yearsExperience (number 3-20), bio (50-100 words). Return ONLY valid JSON array, nothing else.`;
    
    const mentorsData = await runGemini(mentorsPrompt);
    fs.writeFileSync(path.join(process.cwd(), 'data-mentors.json'), mentorsData, 'utf8');
    console.log('  ✓ Saved data-mentors.json');

    // Generate mentees
    console.log('👥 Generating mentee profiles...');
    const menteesPrompt = `Generate 20 realistic tech mentee profiles as a VALID JSON array (no markdown, no backticks, just pure JSON). Each person should have: firstName, lastName, email (format: mentee1@mentorship.test through mentee20@mentorship.test), currentRole (entry level tech role like Junior Developer), targetRole (advanced role like Senior Engineer), goals (50-100 character goal statement), interests (array of 2-4 technical interests). Return ONLY valid JSON array, nothing else.`;
    
    const menteesData = await runGemini(menteesPrompt);
    fs.writeFileSync(path.join(process.cwd(), 'data-mentees.json'), menteesData, 'utf8');
    console.log('  ✓ Saved data-mentees.json');

    // Generate resources
    console.log('📚 Generating learning resources...');
    const resourcesPrompt = `Generate 12 learning resources as a VALID JSON array (no markdown, no backticks, just pure JSON). Each resource should have: title (resource name), description (50-100 character description), fileType (one of: DOCUMENT, VIDEO, IMAGE), topic (tech topic like React, TypeScript, etc). Return ONLY valid JSON array, nothing else.`;
    
    const resourcesData = await runGemini(resourcesPrompt);
    fs.writeFileSync(path.join(process.cwd(), 'data-resources.json'), resourcesData, 'utf8');
    console.log('  ✓ Saved data-resources.json');

    // Generate sessions
    console.log('📅 Generating session templates...');
    const sessionsPrompt = `Generate 15 mentorship session templates as a VALID JSON array (no markdown, no backticks, just pure JSON). Each session should have: sessionType (one of: INTRODUCTORY, TECHNICAL, CAREER_PLANNING, CODE_REVIEW), notes (100-150 character session summary), keyTakeaways (array of 2-3 key learning points), nextSteps (array of 2-3 action items). Return ONLY valid JSON array, nothing else.`;
    
    const sessionsData = await runGemini(sessionsPrompt);
    fs.writeFileSync(path.join(process.cwd(), 'data-sessions.json'), sessionsData, 'utf8');
    console.log('  ✓ Saved data-sessions.json');

    console.log('\n✅ All data files generated successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateData();
