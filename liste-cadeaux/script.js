// ============================================================
// LISTE DE MARIAGE — configuration
// ============================================================
// 1) Remplacez firebaseConfig ci-dessous par la config de VOTRE
//    projet Firebase (voir SETUP.md pour les étapes détaillées).
// 2) Modifiez la liste GIFTS pour définir vos propres cadeaux.
//    - id      : identifiant unique (sert de nom de document Firestore)
//    - name    : nom affiché
//    - desc    : courte description (optionnel)
//    - target  : objectif en euros (optionnel — laissez null pour
//                une cagnotte libre, sans objectif affiché)
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDd8TY-a4uP0Wq052sfkGCP7cLVtlS7ugs",
    authDomain: "pomme-romain-mariage.firebaseapp.com",
    projectId: "pomme-romain-mariage",
    storageBucket: "pomme-romain-mariage.firebasestorage.app",
    messagingSenderId: "752822577885",
    appId: "1:752822577885:web:1878bcd7994f23d7464934"
};

const GIFTS = [

    {
        id: "lune-de-miel",
        name: "Cagnotte voyage de noces",
        desc: "Sûrement dans l'Europe méditerranéene. Vous participez pour le confort nocturne (pour Pomme), le transport (doux) ou la troisième boule de glace pour Romain.",
        target: null
    },
    {
        id: "velo",
        name: "Vélo éléctrique et remorque",
        desc: "Pour remplacer un vélo cargo.",
        target: 5000
    },
    {
        id: "krampouz",
        name: "Crépière Krampouz",
        desc: "Pour vous régaler à la façon bretonne.",
        target: 400
    },
    // {
    //     id: "son",
    //     name: "Systeme son et abonnement musique.",
    //     desc: "Pour réveiller les voisins.",
    //     target: 300
    // },
    // {
    //     id: "stage-mer",
    //     name: "Stage mer",
    //     desc: "pour faire une croisière ensemble.",
    //     target: 1500
    // },
];

// ============================================================
// Ne rien modifier en dessous de cette ligne
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    doc,
    collection,
    onSnapshot,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listEl = document.getElementById("gift-list");

function euros(n) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + "\u00A0€";
}

function renderSkeleton() {
    listEl.innerHTML = "";
    GIFTS.forEach((gift) => {
        const card = document.createElement("div");
        card.className = "gift-card";
        card.dataset.giftId = gift.id;

        card.innerHTML = `
            <div class="gift-head">
                <h4>${gift.name}</h4>
                <span class="gift-amounts">
                    <span class="raised" data-role="raised">…</span>${gift.target ? ` / ${euros(gift.target)}` : ""}
                </span>
            </div>
            ${gift.target ? `<div class="progress-track"><div class="progress-fill" data-role="fill" style="width:0%"></div></div>` : ""}
            ${gift.desc ? `<p class="gift-desc">${gift.desc}</p>` : ""}
            <form class="gift-form" data-role="form">
                <div class="gift-form-row">
                    <input type="number" min="1" step="1" inputmode="numeric" placeholder="Montant en €" required>
                    <button type="submit">Participer</button>
                </div>
                <textarea maxlength="1000" rows="6" placeholder="Un petit mot signé pour les mariés. " required></textarea>
            </form>
            <p class="gift-feedback" data-role="feedback"></p>
        `;

        listEl.appendChild(card);
        wireForm(card, gift);
    });
}

function updateCard(giftId, raised) {
    const card = listEl.querySelector(`[data-gift-id="${giftId}"]`);
    if (!card) return;
    const gift = GIFTS.find((g) => g.id === giftId);

    card.querySelector('[data-role="raised"]').textContent = euros(raised);

    const fill = card.querySelector('[data-role="fill"]');
    if (fill && gift.target) {
        const pct = Math.min(100, Math.round((raised / gift.target) * 100));
        fill.style.width = pct + "%";
    }
}

function wireForm(card, gift) {
    const form = card.querySelector('[data-role="form"]');
    const input = form.querySelector('input[type="number"]');
    const messageEl = form.querySelector("textarea");
    const button = form.querySelector("button");
    const feedback = card.querySelector('[data-role="feedback"]');

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const amount = Math.floor(Number(input.value));
        const message = messageEl.value.trim().slice(0, 1000);

        feedback.textContent = "";
        feedback.className = "gift-feedback";

        if (!amount || amount <= 0) {
            feedback.textContent = "Merci d'indiquer un montant valide.";
            feedback.className = "gift-feedback err";
            return;
        }

        if (!message) {
            feedback.textContent = "Merci d'ajouter un petit mot : c'est obligatoire pour participer !";
            feedback.className = "gift-feedback err";
            return;
        }

        button.disabled = true;
        try {
            await contribute(gift.id, amount, message);
            input.value = "";
            messageEl.value = "";
            feedback.textContent = "Merci pour votre participation \u2728";
            feedback.className = "gift-feedback ok";
        } catch (err) {
            console.error(err);
            feedback.textContent = "Oups, la contribution n'a pas pu être enregistrée. Réessayez dans un instant.";
            feedback.className = "gift-feedback err";
        } finally {
            button.disabled = false;
        }
    });
}

let db;

async function contribute(giftId, amount, message) {
    const ref = doc(db, "cadeaux", giftId);
    const entryRef = doc(collection(db, "cadeaux", giftId, "contributions"));
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists() ? (snap.data().raised || 0) : 0;
        tx.set(ref, { raised: current + amount }, { merge: true });
        tx.set(entryRef, {
            amount,
            message: message || "",
            createdAt: serverTimestamp()
        });
    });
}

function initNav() {
    const links = document.querySelectorAll(".site-nav-link");
    const sections = Array.from(links)
        .map((link) => document.getElementById(link.dataset.target))
        .filter(Boolean);

    if (!sections.length) return;

    const setActive = (id) => {
        links.forEach((link) => link.classList.toggle("active", link.dataset.target === id));
    };

    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActive(visible.target.id);
        },
        { threshold: [0.4, 0.6] }
    );

    sections.forEach((section) => observer.observe(section));
}

function init() {
    initNav();
    renderSkeleton();

    if (firebaseConfig.apiKey === "REMPLACER_MOI") {
        listEl.querySelectorAll('[data-role="raised"]').forEach((el) => (el.textContent = "0\u00A0€"));
        const notice = document.createElement("p");
        notice.className = "gift-status";
        notice.textContent = "Configuration Firebase manquante — voir SETUP.md.";
        listEl.prepend(notice);
        return;
    }

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    GIFTS.forEach((gift) => {
        const ref = doc(db, "cadeaux", gift.id);
        onSnapshot(
            ref,
            (snap) => updateCard(gift.id, snap.exists() ? (snap.data().raised || 0) : 0),
            (err) => {
                console.error(err);
                updateCard(gift.id, 0);
            }
        );
    });
}

init();
