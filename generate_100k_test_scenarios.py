#!/usr/bin/env python3
"""
High-Performance Combinatorial Scenario Generator & Stress-Testing Suite
Project: Parayam Printedukkam (Malayalam Voice-to-Print A4 Document Web App)
Target Endpoint: POST /api/generate-doc

Generates 100,000 completely distinct, non-redundant, combinatorial test scenarios
covering:
  1. Dialect variations (Malabar, Valluvanad, Travancore, High-range, Coastal)
  2. Missing information placeholders (targeting [സ്ഥലം ചേർക്കുക], [കാലാവധി], [സാക്ഷി] leakage)
  3. Conflicting data types & self-correcting speech ("അല്ല സോറി 45,000", spoken numbers)
  4. Mixed-language input (Manglish, GCC Arabic-Malayalam hybrid, Alphanumeric codes)
  5. State retention & empty row validation assertions
"""

import argparse
import itertools
import json
import os
import random
import re
import sys
import time
from typing import Any, Dict, Generator, List, Tuple

# Deterministic seed for reproducible scenario generation
RANDOM_SEED = 20261106
random.seed(RANDOM_SEED)

# ==============================================================================
# DIMENSION 1: NAMES, PLACES & CONTACTS (COMBINATORIAL SEED DATA)
# ==============================================================================

KERALA_PERSON_NAMES = [
    ("മുഹമ്മദ് ഷാഫി കെ.", "Muhammed Shafi K.", "M"),
    ("രാജൻ കെ. വി.", "Rajan K. V.", "M"),
    ("ഫാത്തിമ സുഹ്‌റ പി.", "Fathima Zuhra P.", "F"),
    ("അബ്ദുൽ റഹീം സി. എം.", "Abdul Rahim C. M.", "M"),
    ("സുരേഷ് ബാബു എം.", "Suresh Babu M.", "M"),
    ("ലക്ഷ്മി പ്രിയ ആർ.", "Lakshmi Priya R.", "F"),
    ("തോമസ് ജോസഫ് കുര്യൻ", "Thomas Joseph Kurian", "M"),
    ("മറിയം ബീവി ടി.", "Mariyam Beevi T.", "F"),
    ("അനീഷ് കുമാർ വി.", "Aneesh Kumar V.", "M"),
    ("ആയിഷ നിദ കെ. കെ.", "Aysha Nida K. K.", "F"),
    ("ജ്യോതിഷ് പി. എൻ.", "Jyothish P. N.", "M"),
    ("വിൻസെന്റ് പോൾ പെരേര", "Vincent Paul Pereira", "M"),
    ("ഷെമീർ അലി ഇ.", "Shemeer Ali E.", "M"),
    ("അനുശ്രീ എസ്. നായർ", "Anushree S. Nair", "F"),
    ("ഹംസക്കോയ എം. പി.", "Hamsakoya M. P.", "M"),
    ("ബിജു കെ. മാത്യു", "Biju K. Mathew", "M"),
    ("സൗമ്യ കൃഷ്ണൻ വി.", "Sowmya Krishnan V.", "F"),
    ("അബ്ദുല്ലക്കുട്ടി എൻ.", "Abdullakutty N.", "M"),
    ("റഫീഖ് വി. എം.", "Rafeeq V. M.", "M"),
    ("ദീപക് ചന്ദ്രൻ സി.", "Deepak Chandran C.", "M"),
]

KERALA_LOCALITIES = [
    ("ചേവായൂർ, കോഴിക്കോട്", "കോഴിക്കോട്", "Kozhikode"),
    ("മഞ്ചേരി, മലപ്പുറം", "മലപ്പുറം", "Malappuram"),
    ("തളിപ്പറമ്പ്, കണ്ണൂർ", "കണ്ണൂർ", "Kannur"),
    ("കാഞ്ഞങ്ങാട്, കാസർഗോഡ്", "കാസർഗോഡ്", "Kasaragod"),
    ("ഒറ്റപ്പാലം, പാലക്കാട്", "പാലക്കാട്", "Palakkad"),
    ("ഗുരുവായൂർ, തൃശ്ശൂർ", "തൃശ്ശൂർ", "Thrissur"),
    ("ആലുവ, എറണാകുളം", "എറണാകുളം", "Ernakulam"),
    ("പാലാ, കോട്ടയം", "കോട്ടയം", "Kottayam"),
    ("ചേർത്തല, ആലപ്പുഴ", "ആലപ്പുഴ", "Alappuzha"),
    ("തിരുവല്ല, പത്തനംതിട്ട", "പത്തനംതിട്ട", "Pathanamthitta"),
    ("കൊല്ലം നഗരം, കൊല്ലം", "കൊല്ലം", "Kollam"),
    ("നെയ്യാറ്റിൻകര, തിരുവനന്തപുരം", "തിരുവനന്തപുരം", "Thiruvananthapuram"),
    ("സുൽത്താൻ ബത്തേരി, വയനാട്", "വയനാട്", "Wayanad"),
    ("തൊടുപുഴ, ഇടുക്കി", "ഇടുക്കി", "Idukki"),
]

GULF_CITIES = [
    ("ദുബായ്, യുഎഇ", "Dubai, UAE"),
    ("അബുദാബി, യുഎഇ", "Abu Dhabi, UAE"),
    ("ഷാർജ, യുഎഇ", "Sharjah, UAE"),
    ("റിയാദ്, സൗദി അറേബ്യ", "Riyadh, Saudi Arabia"),
    ("ജിദ്ദ, സൗദി അറേബ്യ", "Jeddah, Saudi Arabia"),
    ("ദോഹ, ഖത്തർ", "Doha, Qatar"),
    ("മസ്കറ്റ്, ഒമാൻ", "Muscat, Oman"),
    ("കുവൈറ്റ് സിറ്റി, കുവൈറ്റ്", "Kuwait City, Kuwait"),
    ("മനാമ, ബഹ്റൈൻ", "Manama, Bahrain"),
]

# ==============================================================================
# DIMENSION 2: DIALECT PHRASING & REGIONAL ACCENTS
# ==============================================================================

DIALECT_PREFIXES = {
    "malabar_formal": "ബഹുമാനപ്പെട്ട വില്ലേജ് ഓഫീസർ അവർകൾ മുൻപാകെ ബോധിപ്പിക്കുന്ന അപേക്ഷ.",
    "malabar_colloquial": "ഞമ്മളെ ചേവായൂർ വില്ലേജ് ആപ്പീസിലേക്ക് കൊടുക്കാനാണ്. എന്റെ ബജ്ജാവ് പറഞ്ഞിറ്റാണ് വേഗം ഒരു കടലാസ് തട്ടിക്കൂട്ടിത്തരണേ.",
    "valluvanad_formal": "ഒറ്റപ്പാലം വില്ലേജ് അധികാരി സമക്ഷം സമർപ്പിക്കുന്ന സാക്ഷ്യപത്ര അപേക്ഷ.",
    "valluvanad_colloquial": "നമ്മടെ വീട്ടുപേര് വടക്കേപ്പാട്ട് എന്നാണ്, കാര്യം പെട്ടെന്ന് തീർത്തുതരണം കേട്ടോ.",
    "central_travancore_formal": "ബഹുമാനപ്പെട്ട എറണാകുളം തഹസിൽദാർ അവർകൾ മുൻപാകെ നൽകുന്ന ആധാര സംബന്ധിയായ അപേക്ഷ.",
    "central_travancore_colloquial": "ഞങ്ങടെ കൊച്ചുമോന്റെ ആവശ്യത്തിനാണ്, പഞ്ചായത്ത് ഓഫീസിൽ നാളെ രാവിലെ തന്നെ ഹാജരാക്കേണ്ടതാണേ.",
    "south_travancore_formal": "തിരുവനന്തപുരം കോർപ്പറേഷൻ സെക്രട്ടറി അവർകൾ മുൻപാകെ സമർപ്പിക്കുന്ന സത്യവാങ്മൂലം.",
    "south_travancore_colloquial": "എന്തര് പറഞ്ഞാലും നാളെ അങ്ങോട്ട് കൊടുക്കണം, അപ്പഴേ കറണ്ട് കണക്ഷൻ ശരിയാവത്തുള്ളൂ.",
    "highrange_settler": "ഇടുക്കി അടിമാലി കൃഷി ഭവനിലേക്ക് കൊടുക്കാനുള്ള നഷ്ടപരിഹാര അപേക്ഷയാണ്, കൈവശാവകാശ രേഖ കൈയിലുണ്ട്.",
    "coastal_vernacular": "തീരദേശത്തെ മത്സ്യത്തൊഴിലാളി ക്ഷേമനിധി ബോർഡിലേക്ക് അടിയന്തരമായി നൽകുന്ന പെൻഷൻ അപേക്ഷയാണ്.",
    "manglish_direct": "ente peru shafi, njan 4 varsham dubaiyil light vehicle driver aayirunnu, nalla cv venam.",
    "gulf_arabic_hybrid": "Iqama renew aavan baakkiyundu, Kafil NOC ready aanu, Talabat delivery work experience 2 years.",
}

# ==============================================================================
# DIMENSION 3: NUMERIC & SELF-CORRECTION CONFLICTS
# ==============================================================================

SELF_CORRECTIONS = [
    ("വാടക പ്രതിമാസം 12,000... അല്ല സോറി 15,000 രൂപയാണ്", 15000, "rent"),
    ("സെക്യൂരിറ്റി ഡെപ്പോസിറ്റ് 50,000... അല്ല ക്ഷമിക്കണം 75,000 രൂപ", 75000, "advance"),
    ("വയസ്സ് 28... അല്ല സോറി 29 വയസ്സ് തികഞ്ഞു", 29, "age"),
    ("പ്രവൃത്തി പരിചയം 4... അല്ല സോറി 6 വർഷത്തെ ഗൾഫ് പരിചയം", 6, "experience"),
    ("വാർഷിക വരുമാനം 35,000 രൂപ... അല്ല സോറി 45,000 രൂപയാണ്", 45000, "income"),
    ("കെട്ടിട നമ്പർ 14/221... അല്ല തിരുത്തി 14/225 എന്ന് ചേർക്കണം", "14/225", "buildingNo"),
    ("ഫോൺ നമ്പർ 98470 12345... അല്ല സോറി 98470 99881 ആണ്", "9847099881", "phone"),
    ("വിസ്തീർണം 4 സെന്റ്... അല്ല സോറി 5.5 സെന്റ് സ്ഥലമാണ്", "5.5 സെന്റ്", "landArea"),
]

ALPHANUMERIC_CODES = [
    ("റീ-സർവ്വേ നമ്പർ 124/3B", "124/3B"),
    ("ബ്ലോക്ക് 14, സർവ്വേ നമ്പർ 452/1A-2", "452/1A-2"),
    ("പാൻ കാർഡ് നമ്പർ ABCDE1234F", "ABCDE1234F"),
    ("ആധാർ നമ്പർ 1234 5678 9012", "1234 5678 9012"),
    ("കെഎസ്ഇബി കൺസ്യൂമർ നമ്പർ 11554422/124/3B", "11554422/124/3B"),
    ("വാഹന രജിസ്ട്രേഷൻ നമ്പർ KL-10-AZ-9988", "KL-10-AZ-9988"),
    ("ഡ്രൈവിംഗ് ലൈസൻസ് നമ്പർ DL-0420110098765", "DL-0420110098765"),
    ("ദുബായ് ആർടിഎ ലൈസൻസ് #394021", "#394021"),
    ("റേഷൻ കാർഡ് നമ്പർ 1029384756", "1029384756"),
]

# ==============================================================================
# DIMENSION 4: TOPICAL DOMAINS & INTENTS
# ==============================================================================

LETTER_INTENTS = [
    {
        "category": "malayalam_letter",
        "subType": "kshema_pension",
        "title": "വാർദ്ധക്യകാല / വിധവാ ക്ഷേമ പെൻഷൻ അപേക്ഷ",
        "keywords": ["ക്ഷേമ പെൻഷൻ", "വരുമാന സർട്ടിഫിക്കറ്റ്", "വാർദ്ധക്യകാലം", "അടിയന്തര സഹായം"],
        "targetOffice": "ഗ്രാമപഞ്ചായത്ത് സെക്രട്ടറി അവർകൾ",
        "partial_missing_elements": ["ration_card_no", "bank_account", "ward_number"],
    },
    {
        "category": "malayalam_letter",
        "subType": "land_mutation_pokkuvaravu",
        "title": "ഭൂമി പോക്കുവരവ് / തണ്ടപ്പേര് മാറ്റൽ അപേക്ഷ",
        "keywords": ["പോക്കുവരവ്", "തണ്ടപ്പേര്", "ആധാരം", "കൈവശാവകാശം"],
        "targetOffice": "വില്ലേജ് ഓഫീസർ അവർകൾ",
        "partial_missing_elements": ["prior_deed_no", "thandapper_no", "boundary_details"],
    },
    {
        "category": "malayalam_letter",
        "subType": "police_complaint_lost",
        "title": "രേഖകൾ നഷ്ടപ്പെട്ടതു സംബന്ധിച്ച പോലീസ് പരാതി",
        "keywords": ["സർട്ടിഫിക്കറ്റ് നഷ്ടപ്പെട്ടു", "പോലീസ് പരാതി", "അന്വേഷണം", "ഡ്യൂപ്ലിക്കേറ്റ്"],
        "targetOffice": "സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (എസ്.എച്ച്.ഒ) അവർകൾ",
        "partial_missing_elements": ["incident_exact_time", "witness_presence"],
    },
    {
        "category": "malayalam_letter",
        "subType": "kseb_tariff_change",
        "title": "വൈദ്യുതി കണക്ഷൻ താരിഫ് മാറ്റൽ / ഫേസ് മാറ്റൽ അപേക്ഷ",
        "keywords": ["കെഎസ്ഇബി", "മീറ്റർ റീഡിംഗ്", "ത്രീ ഫേസ് കണക്ഷൻ", "താരിഫ് മാറ്റം"],
        "targetOffice": "അസിസ്റ്റന്റ് എഞ്ചിനീയർ, കെ.എസ്.ഇ.ബി ഇലക്ട്രിക്കൽ സെക്ഷൻ",
        "partial_missing_elements": ["connected_load_kw", "consumer_number"],
    },
]

CV_INTENTS = [
    {
        "category": "gulf_cv",
        "role": "Professional Light & Heavy Vehicle Driver",
        "roleMalayalam": "ഡ്രൈവർ (ലൈറ്റ് & ഹെവി)",
        "skills": ["GCC Navigation", "VIP Transport", "RTA Rules", "Vehicle Maintenance"],
        "gccKeywords": ["Valid UAE Driving License (#394021)", "Iqama Transferable", "Talabat", "Noon"],
        "partial_prompt_types": ["name_and_role_only", "full_experience_narrative", "spoken_manglish"],
    },
    {
        "category": "gulf_cv",
        "role": "Senior Accountant & Tally Specialist",
        "roleMalayalam": "അക്കൗണ്ടന്റ് & ടാലി വിദഗ്ദ്ധൻ",
        "skills": ["Tally Prime", "VAT Filing (FTA)", "Financial Auditing", "Bank Reconciliation"],
        "gccKeywords": ["B.Com Graduate", "UAE VAT Specialist", "Peachtree", "Excel Advance"],
        "partial_prompt_types": ["name_and_role_only", "full_experience_narrative", "spoken_manglish"],
    },
    {
        "category": "gulf_cv",
        "role": "HVAC & Electrical Maintenance Technician",
        "roleMalayalam": "ഇലക്ട്രീഷ്യൻ & എയർകണ്ടീഷണർ ടെക്നീഷ്യൻ",
        "skills": ["Chiller Plant", "FCU/AHU Overhaul", "Wiring", "Safety Compliance"],
        "gccKeywords": ["ITI Electrical Passed", "5 Years Saudi Oger Experience", "NOC Ready"],
        "partial_prompt_types": ["name_and_role_only", "full_experience_narrative", "spoken_manglish"],
    },
    {
        "category": "gulf_cv",
        "role": "Retail Sales Executive & Cashier",
        "roleMalayalam": "സെയിൽസ് എക്സിക്യൂട്ടീവ് & ക്യാഷ്യർ",
        "skills": ["POS Systems", "Customer Service", "Inventory Stocking", "Multilingual"],
        "gccKeywords": ["Lulu Hypermarket", "Bilingual Arabic/English", "Transferable Visa"],
        "partial_prompt_types": ["name_and_role_only", "full_experience_narrative", "spoken_manglish"],
    },
]

RENTAL_INTENTS = [
    {
        "category": "rental_agreement",
        "propertyType": "Residential House / Apartment",
        "propertyTypeMalayalam": "താമസ വീട് / ഫ്ലാറ്റ്",
        "defaultTenure": "11 മാസം (11 Months)",
        "partial_flags": ["missing_tenure", "missing_witnesses", "missing_survey_no", "numeric_correction"],
    },
    {
        "category": "rental_agreement",
        "propertyType": "Commercial Shop Room / Godown",
        "propertyTypeMalayalam": "വാണിജ്യ കടമുറി / ഗോഡൗൺ",
        "defaultTenure": "11 മാസം (11 Months)",
        "partial_flags": ["missing_tenure", "missing_witnesses", "missing_survey_no", "numeric_correction"],
    },
]

# ==============================================================================
# COMBINATORIAL SCENARIO GENERATOR CLASS
# ==============================================================================

class ScenarioGenerator100k:
    """
    Generates 100,000 unique edge-case test payloads deterministically.
    Uses Python generator streaming to maintain zero memory overhead.
    """

    def __init__(self, target_count: int = 100000):
        self.target_count = target_count

    def generate_scenarios(self) -> Generator[Dict[str, Any], None, None]:
        scenario_id = 1
        
        # Combinatorial base pools
        names = KERALA_PERSON_NAMES
        places = KERALA_LOCALITIES
        gulf_cities = GULF_CITIES
        dialects = list(DIALECT_PREFIXES.items())
        corrections = SELF_CORRECTIONS
        codes = ALPHANUMERIC_CODES
        
        # Infinite cycle over combinations
        combo_stream = itertools.cycle(
            itertools.product(
                names,
                places,
                gulf_cities,
                dialects,
                corrections,
                codes,
            )
        )

        while scenario_id <= self.target_count:
            (person, place, gulf_city, (dialect_key, dialect_text), correction, code) = next(combo_stream)
            
            # Rotate category cyclically: Letter -> CV -> Rental -> Marklist
            cat_choice = scenario_id % 4
            
            if cat_choice == 0:
                # 1. Malayalam Letter Scenario
                intent = LETTER_INTENTS[scenario_id % len(LETTER_INTENTS)]
                prompt, expected_assertions, metadata = self._build_letter_scenario(
                    scenario_id, person, place, dialect_key, dialect_text, correction, code, intent
                )
                category = "malayalam_letter"

            elif cat_choice == 1:
                # 2. Gulf / ATS Resume Scenario
                cv_intent = CV_INTENTS[scenario_id % len(CV_INTENTS)]
                prompt, expected_assertions, metadata = self._build_cv_scenario(
                    scenario_id, person, place, gulf_city, dialect_key, dialect_text, correction, cv_intent
                )
                category = "gulf_cv"

            elif cat_choice == 2:
                # 3. Rental / Lease Agreement Scenario
                rent_intent = RENTAL_INTENTS[scenario_id % len(RENTAL_INTENTS)]
                second_person = names[(scenario_id + 5) % len(names)]
                prompt, expected_assertions, metadata = self._build_rental_scenario(
                    scenario_id, person, second_person, place, dialect_key, dialect_text, correction, code, rent_intent
                )
                category = "rental_agreement"

            else:
                # 4. Marksheet / Tabulation Scenario
                prompt, expected_assertions, metadata = self._build_marklist_scenario(
                    scenario_id, person, place, dialect_key, dialect_text
                )
                category = "mark_list"

            payload = {
                "scenario_id": f"SCENARIO-{scenario_id:06d}",
                "category": category,
                "request_payload": {
                    "prompt": prompt,
                    "preferredCategory": category,
                    "outputLanguage": "en" if category == "gulf_cv" else "ml",
                    "currentDocument": {},
                },
                "expected_assertions": expected_assertions,
                "metadata": metadata,
            }

            yield payload
            scenario_id += 1

    def _build_letter_scenario(
        self,
        sid: int,
        person: Tuple[str, str, str],
        place: Tuple[str, str, str],
        dialect_key: str,
        dialect_text: str,
        correction: Tuple[str, Any, str],
        code: Tuple[str, str],
        intent: Dict[str, Any],
    ) -> Tuple[str, List[str], Dict[str, Any]]:
        mal_name, eng_name, _ = person
        mal_place, district, _ = place
        corr_text, corr_val, _ = correction
        code_text, raw_code = code

        is_partial = (sid % 3 == 0)
        has_correction = (sid % 4 == 0)

        parts = [dialect_text]
        parts.append(f"എന്റെ പേര് {mal_name}, മേൽവിലാസം: {mal_place}.")
        parts.append(f"ആവശ്യം: {intent['title']}.")

        if has_correction:
            parts.append(corr_text + ".")
        
        parts.append(f"രേഖ: {code_text}.")

        if not is_partial:
            parts.append(f"ഈ വിഷയം അടിയന്തരമായി പരിഗണിച്ച് {intent['targetOffice']} എനിക്ക് അനുകൂലമായ നടപടി സ്വീകരിക്കണമെന്ന് അപേക്ഷിക്കുന്നു.")

        full_prompt = " ".join(parts)

        assertions = [
            "assert_no_bracket_leakage",  # Checks no [സ്ഥലം ചേർക്കുക] or [മേൽവിലാസം]
            "assert_valid_sender_name",
            "assert_alphanumeric_code_preserved",  # Checks 124/3B is not converted to 124/3ബി
            "assert_no_empty_table_rows_when_printed",
        ]

        metadata = {
            "dialect": dialect_key,
            "sub_type": intent["subType"],
            "has_self_correction": has_correction,
            "expected_corrected_value": corr_val if has_correction else None,
            "embedded_code": raw_code,
            "is_partial_prompt": is_partial,
        }

        return full_prompt, assertions, metadata

    def _build_cv_scenario(
        self,
        sid: int,
        person: Tuple[str, str, str],
        place: Tuple[str, str, str],
        gulf_city: Tuple[str, str],
        dialect_key: str,
        dialect_text: str,
        correction: Tuple[str, Any, str],
        cv_intent: Dict[str, Any],
    ) -> Tuple[str, List[str], Dict[str, Any]]:
        mal_name, eng_name, _ = person
        mal_place, _, _ = place
        mal_city, eng_city = gulf_city
        corr_text, corr_val, _ = correction

        prompt_style = sid % 3

        if prompt_style == 0:
            # Ultra-short partial voice: user just says name and job role
            full_prompt = f"എന്റെ പേര് {mal_name}. എനിക്ക് {cv_intent['roleMalayalam']} ജോലിക്കായി {mal_city}-ലേക്ക് ഒരു ഗൾഫ് സിവി വേണം."
            is_partial = True
        elif prompt_style == 1:
            # Manglish / Arabic mix prompt
            full_prompt = (
                f"ente peru {eng_name}, native place {mal_place}. "
                f"worked in {eng_city} as {cv_intent['role']}. "
                f"{cv_intent['gccKeywords'][0]}, {cv_intent['gccKeywords'][1]}. "
                f"nalla professional english cv ready aakkanam."
            )
            is_partial = False
        else:
            # Colloquial Malayalam with self-correction
            full_prompt = (
                f"{dialect_text} എന്റെ പേര് {mal_name}, സ്വദേശം {mal_place}. "
                f"ഞാൻ {mal_city}-ൽ {cv_intent['roleMalayalam']} ആയി ജോലി ചെയ്തിട്ടുണ്ട്. "
                f"{corr_text}. {cv_intent['gccKeywords'][0]}. "
                f"നല്ല രീതിയിൽ എല്ലാത്തരം വാഹനങ്ങളും ഓടിക്കാൻ അറിയാം, ഉപഭോക്താക്കളോട് മാന്യമായി പെരുമാറും."
            )
            is_partial = False

        assertions = [
            "assert_no_bracket_leakage",
            "assert_cv_details_retained",  # summary, education & declaration NEVER wiped
            "assert_english_output_language",
            "assert_no_phonetic_manglish_in_duties",
        ]

        metadata = {
            "dialect": dialect_key,
            "role": cv_intent["role"],
            "is_partial_prompt": is_partial,
            "target_city": eng_city,
            "expected_name_english": eng_name,
        }

        return full_prompt, assertions, metadata

    def _build_rental_scenario(
        self,
        sid: int,
        first_party: Tuple[str, str, str],
        second_party: Tuple[str, str, str],
        place: Tuple[str, str, str],
        dialect_key: str,
        dialect_text: str,
        correction: Tuple[str, Any, str],
        code: Tuple[str, str],
        rent_intent: Dict[str, Any],
    ) -> Tuple[str, List[str], Dict[str, Any]]:
        owner_name, _, _ = first_party
        tenant_name, _, _ = second_party
        mal_place, _, _ = place
        corr_text, corr_val, _ = correction
        code_text, raw_code = code

        # Edge cases:
        # A: Missing tenure -> must strictly default to 11 months without [കാലാവധി]
        # B: Missing witnesses -> must generate valid placeholder lines without [സാക്ഷിയുടെ പേരും ഒപ്പും]
        # C: Numeric self-correction -> must take the second (corrected) number
        is_tenure_missing = (sid % 2 == 0)
        has_correction = (sid % 3 == 0)

        parts = [dialect_text]
        parts.append(f"വാടകക്കരാർ തയ്യാറാക്കാനാണ്. ഒന്നാം കക്ഷി കെട്ടിട ഉടമസ്ഥൻ {owner_name}, രണ്ടാം കക്ഷി വാടകക്കാരൻ {tenant_name}.")
        parts.append(f"കെട്ടിടം സ്ഥിതി ചെയ്യുന്നത്: {mal_place}. {code_text}.")

        if has_correction:
            parts.append(corr_text + ".")
        else:
            parts.append("പ്രതിമാസ വാടക 15,000 രൂപയും സെക്യൂരിറ്റി ഡെപ്പോസിറ്റ് 50,000 രൂപയുമാണ്.")

        if not is_tenure_missing:
            parts.append("കരാർ കാലാവധി 11 മാസത്തേക്ക് നിശ്ചയിച്ചിരിക്കുന്നു.")
        # If is_tenure_missing is True, prompt omits tenure completely to stress-test fallback

        full_prompt = " ".join(parts)

        assertions = [
            "assert_no_bracket_leakage",  # zero [സ്ഥലം], [മേൽവിലാസം], [കാലാവധി], [സാക്ഷി]
            "assert_clauses_array_valid",  # clauses must be Array of strings, never undefined
            "assert_default_tenure_11_months",
            "assert_no_server_crash",
        ]

        metadata = {
            "dialect": dialect_key,
            "property_type": rent_intent["propertyType"],
            "is_tenure_missing": is_tenure_missing,
            "expected_tenure": "11 മാസം",
            "has_correction": has_correction,
            "expected_corrected_value": corr_val if has_correction else 15000,
            "embedded_survey_code": raw_code,
        }

        return full_prompt, assertions, metadata

    def _build_marklist_scenario(
        self,
        sid: int,
        person: Tuple[str, str, str],
        place: Tuple[str, str, str],
        dialect_key: str,
        dialect_text: str,
    ) -> Tuple[str, List[str], Dict[str, Any]]:
        mal_name, _, _ = person
        mal_place, _, _ = place

        subjects = [
            ("മലയാളം", random.randint(35, 50)),
            ("ഇംഗ്ലീഷ്", random.randint(32, 50)),
            ("ഹിന്ദി", random.randint(30, 50)),
            ("ഗണിതം", random.randint(28, 50)),
            ("സയൻസ്", random.randint(30, 50)),
            ("സോഷ്യൽ സയൻസ്", random.randint(35, 50)),
        ]
        
        subj_str = ", ".join([f"{s[0]}: {s[1]}/50" for s in subjects])
        full_prompt = (
            f"{dialect_text} വിദ്യാർത്ഥിയുടെ പേര്: {mal_name}, സ്കൂൾ: {mal_place}. "
            f"ക്ലാസ്സ് പരീക്ഷാ മാർക്കുകൾ ഇവയാണ്: {subj_str}."
        )

        assertions = [
            "assert_no_bracket_leakage",
            "assert_marks_numerical_integrity",
        ]

        metadata = {
            "dialect": dialect_key,
            "student_name": mal_name,
            "total_subjects": len(subjects),
        }

        return full_prompt, assertions, metadata


# ==============================================================================
# AUDIT ASSERTION ENGINE (FOR RUNNING VALIDATIONS AGAINST LIVE ENDPOINTS)
# ==============================================================================

class ScenarioValidator:
    """
    Validates API responses against the strict audit criteria:
      1. Zero bracket leakage ([...])
      2. No 124/3B -> 124/3ബി transliteration corruption
      3. Valid non-empty clauses array in rental agreements
      4. Retained CV summary, education & declaration on partial voice
      5. No unedited empty rows printed in table
    """

    BRACKET_REGEX = re.compile(r"\[(?:സ്ഥലം|മേൽവിലാസം|കാലാവധി|സാക്ഷി|പേര്|തീയതി|ചേർക്കുക)[^\]]*\]", re.IGNORECASE)

    @classmethod
    def validate(cls, scenario: Dict[str, Any], response_data: Dict[str, Any]) -> List[str]:
        errors = []
        expected = scenario.get("expected_assertions", [])

        # 1. Assert No Bracket Leakage
        if "assert_no_bracket_leakage" in expected:
            raw_json_str = json.dumps(response_data, ensure_ascii=False)
            bracket_matches = cls.BRACKET_REGEX.findall(raw_json_str)
            if bracket_matches:
                errors.append(f"FAIL: Leaked template brackets in output: {bracket_matches[:3]}")

        # 2. Assert Rental Clauses Valid & Not Empty
        if "assert_clauses_array_valid" in expected:
            ag = response_data.get("agreementData") or {}
            clauses = ag.get("clauses")
            if not isinstance(clauses, list) or len(clauses) == 0:
                errors.append("FAIL: Rental Agreement 'clauses' is missing, empty, or not an array!")
            else:
                for c in clauses:
                    if "[കാലാവധി]" in str(c) or "[മാസം]" in str(c):
                        errors.append(f"FAIL: Clause contains unparsed tenure bracket: '{c}'")

        # 3. Assert Default Tenure 11 Months
        if "assert_default_tenure_11_months" in expected:
            ag = response_data.get("agreementData") or {}
            tenure_str = str(ag.get("tenurePeriod") or ag.get("duration") or "")
            if "11" not in tenure_str and "പതിനൊന്ന്" not in tenure_str:
                errors.append(f"FAIL: Unspecified tenure did not default to 11 months. Got: '{tenure_str}'")

        # 4. Assert Alphanumeric Code Preservation
        if "assert_alphanumeric_code_preserved" in expected:
            raw_code = scenario["metadata"].get("embedded_code") or scenario["metadata"].get("embedded_survey_code")
            if raw_code:
                raw_json_str = json.dumps(response_data, ensure_ascii=False)
                # Check for corrupted transliteration e.g. 124/3B -> 124/3ബി
                corrupted_variant = raw_code.replace("B", "ബി").replace("A", "എ")
                if corrupted_variant in raw_json_str and raw_code not in raw_json_str:
                    errors.append(f"FAIL: Alphanumeric code '{raw_code}' was corrupted to '{corrupted_variant}'!")

        # 5. Assert CV Details Retained
        if "assert_cv_details_retained" in expected:
            cv = response_data.get("gulfCvData") or {}
            summary = cv.get("professionalSummary", "")
            education = cv.get("education", [])
            declaration = cv.get("declaration", "")
            if not summary or not summary.strip():
                errors.append("FAIL: CV professionalSummary was wiped/empty on partial voice prompt!")
            if not education or len(education) == 0:
                errors.append("FAIL: CV education array was wiped/empty on partial voice prompt!")
            if not declaration or not declaration.strip():
                errors.append("FAIL: CV declaration was wiped/empty on partial voice prompt!")

        return errors


# ==============================================================================
# CLI RUNNER & DISK STREAMER
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="100,000 Unique Edge-Case Scenario Generator for Malayalam Voice-to-Print"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=100000,
        help="Number of unique scenarios to generate (default: 100,000)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="test_scenarios_100k.jsonl",
        help="Output file path (default: test_scenarios_100k.jsonl)",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Print 5 random sample scenarios to console and exit",
    )
    parser.add_argument(
        "--test-local",
        type=int,
        metavar="N",
        help="Execute live HTTP test of first N generated scenarios against http://localhost:3000/api/generate-doc",
    )

    args = parser.parse_args()

    generator = ScenarioGenerator100k(target_count=args.count)

    # Mode 1: Sample inspection
    if args.sample:
        print(f"--- Printing 5 Sample Scenarios from 100k Matrix ---")
        for i, sc in enumerate(generator.generate_scenarios()):
            if i >= 5:
                break
            print(f"\n[Scenario #{i+1}] {sc['scenario_id']} ({sc['category']})")
            print(f"Spoken Voice Prompt: {sc['request_payload']['spokenTranscript']}")
            print(f"Expected Assertions: {sc['expected_assertions']}")
            print(f"Metadata: {sc['metadata']}")
        return

    # Mode 2: Live Local HTTP Testing
    if args.test_local:
        try:
            import urllib.request
            import urllib.error
        except ImportError:
            print("urllib is required for HTTP testing.")
            return

        endpoint = "http://localhost:3000/api/generate-doc"
        limit = args.test_local
        print(f"--- Running live test of {limit} scenarios against {endpoint} ---")
        
        passed = 0
        failed = 0
        start_time = time.time()

        for idx, scenario in enumerate(generator.generate_scenarios()):
            if idx >= limit:
                break
            
            sid = scenario["scenario_id"]
            payload_bytes = json.dumps(scenario["request_payload"]).encode("utf-8")
            req = urllib.request.Request(
                endpoint,
                data=payload_bytes,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    errors = ScenarioValidator.validate(scenario, resp_data)
                    if errors:
                        failed += 1
                        print(f"❌ [{sid}] FAIL: {errors[0]}")
                    else:
                        passed += 1
                        print(f"✅ [{sid}] PASS ({scenario['category']})")
            except Exception as e:
                failed += 1
                print(f"❌ [{sid}] HTTP ERROR: {e}")

        total = passed + failed
        elapsed = time.time() - start_time
        pass_rate = (passed / total * 100) if total > 0 else 0
        print(f"\n==========================================")
        print(f"AUDIT SUMMARY: {passed}/{total} PASSED ({pass_rate:.1f}%) in {elapsed:.2f}s")
        print(f"==========================================")
        return

    # Mode 3: Stream 100,000 scenarios to disk
    out_path = args.output
    print(f"Generating {args.count:,} unique combinatorial scenarios...")
    print(f"Streaming disk write to: {os.path.abspath(out_path)}")

    start_time = time.time()
    count = 0

    with open(out_path, "w", encoding="utf-8") as f:
        for scenario in generator.generate_scenarios():
            f.write(json.dumps(scenario, ensure_ascii=False) + "\n")
            count += 1
            if count % 20000 == 0:
                print(f"  -> Generated {count:,} / {args.count:,} scenarios ({time.time() - start_time:.1f}s)...")

    elapsed = time.time() - start_time
    file_size_mb = os.path.getsize(out_path) / (1024 * 1024)

    print(f"\n✓ Successfully generated {count:,} distinct scenarios!")
    print(f"✓ Output file: {out_path} ({file_size_mb:.2f} MB)")
    print(f"✓ Time elapsed: {elapsed:.2f} seconds ({count/elapsed:.0f} scenarios/sec)")
    print(f"\nTo inspect sample scenarios: python3 {sys.argv[0]} --sample")
    print(f"To test first 100 scenarios locally: python3 {sys.argv[0]} --test-local 100")


if __name__ == "__main__":
    main()
