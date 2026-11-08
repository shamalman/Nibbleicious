const form = document.querySelector('#signup-form');
const emailInput = document.querySelector('#email');
const submitButton = document.querySelector('#submit-btn');
const status = document.querySelector('#status');
document.querySelector('#year').textContent = new Date().getFullYear();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  status.className = 'status';
  if (!emailInput.checkValidity()) {
    status.textContent = 'Please enter a valid email address.';
    status.classList.add('error');
    emailInput.focus();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = 'One sec…';
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value.trim(), website: form.website.value }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    status.textContent = 'You’re on the list! Sweet news is headed your way. 🍪';
    status.classList.add('success');
    form.reset();
  } catch (error) {
    status.textContent = error.message || 'Something went wrong. Please try again.';
    status.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Keep me posted <span aria-hidden="true">↗</span>';
  }
});
