/**
 * PilotTag v2.0 - Autonomous Behavioral Tracking & Intent JS Snippet
 * GrowthPilot AI (Markopolo-Grade Client Intelligence)
 */
(function (window, document) {
  'use strict';

  var PilotTag = window.PilotTag || {};
  if (PilotTag.initialized) return;
  PilotTag.initialized = true;

  var siteId = document.currentScript ? document.currentScript.getAttribute('data-site-id') : 'DEMO_SITE';
  var endpoint = (document.currentScript ? document.currentScript.getAttribute('data-endpoint') : '') || '/api/gp2/capi';

  var state = {
    sessionId: 'gp2_sess_' + Math.random().toString(36).slice(2, 10),
    startTime: Date.now(),
    maxScroll: 0,
    hesitations: 0,
    pageSwitches: 0,
  };

  function sendEvent(name, customData) {
    var payload = {
      eventName: name,
      eventSourceUrl: window.location.href,
      siteId: siteId,
      sessionId: state.sessionId,
      clientTimestamp: Date.now(),
      scrollDepth: state.maxScroll,
      hesitations: state.hesitations,
      customData: customData || {},
    };

    try {
      if (window.navigator && window.navigator.sendBeacon) {
        window.navigator.sendBeacon(endpoint, JSON.stringify(payload));
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {}

    // Dispatch custom DOM event for live debug dashboards
    var evt = new CustomEvent('PilotTagEvent', { detail: payload });
    window.dispatchEvent(evt);
  }

  // 1. Initial Page View
  sendEvent('PageView', { title: document.title });

  // 2. Scroll Depth Tracking
  window.addEventListener('scroll', function () {
    var h = document.documentElement,
      b = document.body,
      st = 'scrollTop',
      sh = 'scrollHeight';
    var percent = Math.round(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100);
    if (percent > state.maxScroll) {
      state.maxScroll = percent;
      if (percent >= 50 && !state.tracked50) {
        state.tracked50 = true;
        sendEvent('Scroll50', { depth: 50 });
      }
      if (percent >= 90 && !state.tracked90) {
        state.tracked90 = true;
        sendEvent('Scroll90', { depth: 90 });
      }
    }
  }, { passive: true });

  // 3. Button Hesitation Pattern Detection
  document.addEventListener('mouseover', function (e) {
    var target = e.target.closest('button, a, [role="button"]');
    if (!target) return;
    var txt = (target.innerText || '').toLowerCase();
    if (txt.includes('buy') || txt.includes('order') || txt.includes('cart') || txt.includes('checkout') || txt.includes('অর্ডার')) {
      var hoverStart = Date.now();
      var onLeave = function () {
        var hoverDuration = Date.now() - hoverStart;
        if (hoverDuration > 1200) {
          state.hesitations++;
          sendEvent('CheckoutHesitation', { durationMs: hoverDuration, buttonText: txt.slice(0, 30) });
        }
        target.removeEventListener('mouseleave', onLeave);
      };
      target.addEventListener('mouseleave', onLeave);
    }
  });

  // 4. Tab Switching / Exit Intent Detection
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      state.pageSwitches++;
      sendEvent('TabSwitchExitIntent', { pageSwitches: state.pageSwitches });
    }
  });

  // Public SDK methods
  PilotTag.track = sendEvent;
  PilotTag.trackPurchase = function (amount, currency, orderId) {
    sendEvent('Purchase', { value: amount, currency: currency || 'BDT', orderId: orderId });
  };
  PilotTag.trackAddToCart = function (productName, price) {
    sendEvent('AddToCart', { contentName: productName, value: price });
  };

  window.PilotTag = PilotTag;
})(window, document);
