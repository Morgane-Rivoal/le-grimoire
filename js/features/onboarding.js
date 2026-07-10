// Onboarding premier lancement : présente les usages clés une seule fois.
const ONBOARDING_STEPS = [
  {icon:"📖", key:"welcome"},
  {icon:"🔍", key:"identify"},
  {icon:"📖", key:"herbarium"},
  {icon:"🏆", key:"achievements"}
];
let onboardingIndex = 0;

function renderOnboardingStep(){
  const step = ONBOARDING_STEPS[onboardingIndex];
  const icon = document.getElementById("onboardingIcon");
  const title = document.getElementById("onboardingTitle");
  const text = document.getElementById("onboardingText");
  const dots = document.getElementById("onboardingDots");
  const nextButton = document.getElementById("onboardingNext");
  if(!step || !icon) return;
  icon.textContent = step.icon;
  title.textContent = t(`onboarding.${step.key}.title`);
  text.textContent = t(`onboarding.${step.key}.text`);
  dots.innerHTML = ONBOARDING_STEPS.map((_, index) =>
    `<span class="onboarding-dot ${index === onboardingIndex ? "active" : ""}"></span>`
  ).join("");
  nextButton.textContent = onboardingIndex === ONBOARDING_STEPS.length - 1
    ? t("onboarding.start")
    : t("onboarding.next");
}

function onboardingNext(){
  if(onboardingIndex < ONBOARDING_STEPS.length - 1){
    onboardingIndex++;
    renderOnboardingStep();
  } else {
    finishOnboarding();
  }
}

function finishOnboarding(){
  document.getElementById("onboarding")?.classList.add("hidden");
  try{
    localStorage.setItem("grimoire-onboarded", "1");
  } catch{}
}

function maybeStartOnboarding(){
  let done = false;
  try{
    done = localStorage.getItem("grimoire-onboarded") === "1";
  } catch{}
  if(done) return;
  const overlay = document.getElementById("onboarding");
  if(!overlay) return;
  onboardingIndex = 0;
  renderOnboardingStep();
  overlay.classList.remove("hidden");
}
