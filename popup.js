document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('profitForm');
    const formErrors = document.getElementById('formErrors');
    const retailPrice = form.retailPrice;
    const marginTarget = form.marginTarget;
    const pricePosition = form.pricePosition;
    const cost = form.cost;
    const financeCommission = form.financeCommission;
    const financeCommissionOutput = document.getElementById('financeCommissionOutput');
    const maxPurchasePriceOutput = document.getElementById('maxPurchasePrice');
    const totalMarginOutput = document.getElementById('totalMargin');
    const marginPercentOutput = document.getElementById('marginPercent');
    const saveBtn = document.getElementById('saveBtn');
    const btnContent = saveBtn.querySelector('.btn-content');
    const btnSpinner = saveBtn.querySelector('.btn-spinner');
    const btnCheckmark = saveBtn.querySelector('.btn-checkmark');
    const csvBtn = document.getElementById('csvBtn');
  
    // Save/load last-used values
    const STORAGE_KEY = 'profitCalcForm';
    function saveForm() {
      const data = {
        retailPrice: retailPrice.value,
        marginTarget: marginTarget.value,
        pricePosition: pricePosition.value,
        cost: cost.value,
        financeCommission: financeCommission.value
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    function loadForm() {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (data.retailPrice) retailPrice.value = data.retailPrice;
      if (data.marginTarget) marginTarget.value = data.marginTarget;
      if (data.pricePosition) pricePosition.value = data.pricePosition;
      if (data.cost) cost.value = data.cost;
      if (data.financeCommission) financeCommission.value = data.financeCommission;
      calculate();
    }
  
    function formatCurrency(val) {
      return '£' + (parseFloat(val) || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
  
    function calculate() {
      const retail = parseFloat(retailPrice.value) || 0;
      const margin = parseFloat(marginTarget.value) || 0;
      const position = parseFloat(pricePosition.value) || 1;
      const costVal = parseFloat(cost.value) || 0;
      const financeRate = parseFloat(financeCommission.value) || 0;
  
      // Calculate finance commission (example: retail * financeRate / 100)
      const financeComm = retail * (financeRate / 100);
      // Max purchase price (example: retail - margin - financeComm)
      const maxPurchasePrice = retail - margin - financeComm;
      // Total margin (example: retail - costVal - financeComm)
      const totalMargin = retail - costVal - financeComm;
      // Margin percent (example: (totalMargin / retail) * 100)
      const marginPercent = retail > 0 ? (totalMargin / retail) * 100 : 0;
  
      financeCommissionOutput.textContent = formatCurrency(financeComm);
      maxPurchasePriceOutput.textContent = formatCurrency(maxPurchasePrice);
      totalMarginOutput.textContent = formatCurrency(totalMargin);
      marginPercentOutput.textContent = `${marginPercent.toFixed(1)}% margin`;
    }
  
    [retailPrice, marginTarget, pricePosition, cost, financeCommission].forEach(input => {
      input.addEventListener('input', function() {
        calculate();
        input.classList.remove('input-highlight');
        void input.offsetWidth; // force reflow
        input.classList.add('input-highlight');
        setTimeout(() => input.classList.remove('input-highlight'), 700);
        saveForm();
      });
    });
  
    loadForm();
  
    function showError(input, message) {
      const group = input.closest('.form-group');
      if (group) {
        const errorSpan = group.querySelector('.input-error');
        if (errorSpan) {
          errorSpan.textContent = message || '';
          errorSpan.style.display = message ? 'block' : 'none';
        }
      }
    }
  
    function validateForm() {
      let valid = true;
      let messages = [];
      // Retail Price
      if (!retailPrice.value || parseFloat(retailPrice.value) <= 0) {
        showError(retailPrice, 'Retail price must be greater than 0.');
        valid = false;
        messages.push('Retail price must be greater than 0.');
      } else {
        showError(retailPrice, '');
      }
      // Margin Target
      if (!marginTarget.value || parseFloat(marginTarget.value) < 0) {
        showError(marginTarget, 'Margin target is required.');
        valid = false;
        messages.push('Margin target is required.');
      } else {
        showError(marginTarget, '');
      }
      // Price Position
      if (!pricePosition.value || parseFloat(pricePosition.value) <= 0) {
        showError(pricePosition, 'Price position must be greater than 0.');
        valid = false;
        messages.push('Price position must be greater than 0.');
      } else {
        showError(pricePosition, '');
      }
      // Cost
      if (!cost.value || parseFloat(cost.value) < 0) {
        showError(cost, 'Cost is required.');
        valid = false;
        messages.push('Cost is required.');
      } else {
        showError(cost, '');
      }
      // Finance Commission
      if (!financeCommission.value || parseFloat(financeCommission.value) < 0) {
        showError(financeCommission, 'Finance commission is required.');
        valid = false;
        messages.push('Finance commission is required.');
      } else {
        showError(financeCommission, '');
      }
      // Show summary error
      if (!valid) {
        formErrors.innerHTML = messages.map(m => `<div>${m}</div>`).join('');
        formErrors.style.display = 'block';
      } else {
        formErrors.innerHTML = '';
        formErrors.style.display = 'none';
      }
      return valid;
    }
  
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm()) {
        return;
      }
      // Enhanced button feedback
      btnContent.style.opacity = 0;
      btnSpinner.style.display = 'inline-block';
      btnCheckmark.style.display = 'none';
      saveBtn.disabled = true;
      setTimeout(() => {
        btnSpinner.style.display = 'none';
        btnCheckmark.style.display = 'inline-block';
        setTimeout(() => {
          btnCheckmark.style.display = 'none';
          btnContent.style.opacity = 1;
          saveBtn.disabled = false;
          // PDF export logic
          exportPDF();
        }, 1200);
      }, 1200);
    });
  
    // Toast notification logic
    const toast = document.getElementById('toast');
    function showToast(message) {
      toast.textContent = message;
      toast.style.display = 'block';
      // Adapt to theme
      if (sidebar.classList.contains('light-theme')) {
        toast.classList.add('light-theme');
      } else {
        toast.classList.remove('light-theme');
      }
      setTimeout(() => { toast.style.display = 'none'; }, 2500);
    }
  
    function exportPDF() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 24; // More top margin
      const leftMargin = 18;
      const boxPadding = 8;
      const labelX = leftMargin + boxPadding;
      const valueX = 90;
  
      // Logo
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = 'WhatsApp Image 2025-07-03 at 11.48.27_e3ee7201.jpg';
      img.onload = function() {
        doc.addImage(img, 'JPEG', leftMargin, y, 22, 22);
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Profit Calculator Report', leftMargin + 28, y + 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const now = new Date();
        doc.text(now.toLocaleString('en-GB'), pageWidth - leftMargin, y + 12, {align: 'right'});
        y += 32; // More space after logo/title
  
        // Green box for inputs/outputs
        const boxWidth = pageWidth - leftMargin * 2;
        let boxHeight = 80; // Will adjust as we go
        const boxY = y;
        // Calculate dynamic box height
        let lines = 0;
        lines += 1 + 5 + 1 + 3; // Inputs header + 5 inputs + Outputs header + 3 outputs
        boxHeight = boxPadding * 2 + lines * 8 + 10;
        doc.setDrawColor(0, 200, 150);
        doc.setLineWidth(0.7);
        doc.roundedRect(leftMargin, boxY, boxWidth, boxHeight, 5, 5);
        y += boxPadding + 6;
  
        // Inputs Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Inputs', labelX, y);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Retail Price:', labelX, y); doc.text(formatCurrency(retailPrice.value), valueX, y);
        y += 8;
        doc.text('Margin Target:', labelX, y); doc.text(formatCurrency(marginTarget.value), valueX, y);
        y += 8;
        doc.text('Price Position %:', labelX, y); doc.text((pricePosition.value || '0'), valueX, y);
        y += 8;
        doc.text('Cost:', labelX, y); doc.text(formatCurrency(cost.value), valueX, y);
        y += 8;
        doc.text('Finance Commission:', labelX, y); doc.text(formatCurrency(financeCommission.value), valueX, y);
        y += 12;
  
        // Outputs Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Calculated Outputs', labelX, y);
        y += 9;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Max Purchase Price:', labelX, y); doc.text(maxPurchasePriceOutput.textContent, valueX, y);
        y += 8;
        doc.text('Total Potential Margin:', labelX, y); doc.text(totalMarginOutput.textContent, valueX, y);
        y += 8;
        doc.text('Margin Percent:', labelX, y); doc.text(`${marginPercentOutput.textContent}`, valueX, y);
  
        doc.save('profit-calculator-report.pdf');
        showToast('PDF saved!');
      };
    }
  
    csvBtn.addEventListener('click', function () {
      if (!validateForm()) return;
      const headers = [
        'Retail Price', 'Cheese Margin Target', 'Price Position %', 'Cost', 'Finance Commission', 'Max Purchase Price', 'Total Potential Margin', 'Margin Percent'
      ];
      const values = [
        retailPrice.value,
        marginTarget.value,
        pricePosition.value,
        cost.value,
        financeCommission.value,
        maxPurchasePriceOutput.textContent,
        totalMarginOutput.textContent,
        marginPercentOutput.textContent
      ];
      const csvContent = headers.join(',') + '\n' + values.join(',');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'profit-calculator-report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('CSV exported!');
    });
  
    // Theme toggle logic
    const sidebar = document.querySelector('.sidebar-calculator');
    const themeToggle = document.getElementById('themeToggle');
    function setTheme(mode) {
      if (mode === 'light') {
        sidebar.classList.add('light-theme');
        sidebar.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'light');
      } else {
        sidebar.classList.add('dark-theme');
        sidebar.classList.remove('light-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'dark');
      }
    }
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme === 'light' ? 'light' : 'dark');
    themeToggle.addEventListener('click', function () {
      setTheme(sidebar.classList.contains('light-theme') ? 'dark' : 'light');
    });
  });