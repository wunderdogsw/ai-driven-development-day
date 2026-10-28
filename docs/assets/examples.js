// "Click to Copy" on every file window of the example pages.
document.querySelectorAll(".ex-copy").forEach((button) => {
  button.addEventListener("click", async () => {
    const pre = document.getElementById(button.dataset.target);
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(pre.innerText);
      button.textContent = "Copied";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(pre);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      button.textContent = "Selected: press Ctrl/Cmd+C";
    }
    setTimeout(() => (button.textContent = label), 1800);
  });
});
