/**
 * NIST's page. A smaller page than TrueLine's or Clarity's, about the work done there and not the
 * pipeline step by step. Adam approved this wording on 21 Nov 2026; every figure is from his own
 * summary of the internship. The scraper's address range is left out on purpose.
 */
export const NIST = {
  strip: [
    ["Role", "Research intern, SURF program"],
    ["Where", "NIST, Gaithersburg, MD"],
    ["When", "May to August 2026"],
    ["Built with", "Python, pandas, scikit-learn, Streamlit"],
  ] as [string, string][],

  worked: [
    "NIST runs a public portal where anyone can search and download its research data. Not everyone at NIST, or even in the office that runs the portal, has access to its logs, so the team had no clear picture of how the portal is used.",
    "The logs are also hard to read. Every line is one request, so even a simple question like how many people visited takes real work to answer, and people are mixed in with scrapers and bots. My job was to make the logs readable and to separate the two, so the usage numbers describe real readers.",
  ],

  did: [
    "I worked through nine months of logs, about a million requests. Early on I found that one export had been loaded twice, which inflated every count by about 18%.",
    "The usual way to spot a bot is to trust what it says it is. That flagged 21.7% of the traffic. I added rules based on how each visitor behaves, then ran an anomaly detector to audit my own rules. It turned up a scraper that was posing as a normal browser and came back every month. On its busiest day it made over 50,000 requests. Once I accounted for it and others like it, the automated share was 41.9%, nearly double the first estimate.",
    "I then trained a model that tells bots from people using only behavior, never the label a visitor gives itself. It reached an F1 score of 0.94.",
  ],

  figs: [
    ["41.9%", "of the portal’s traffic is automated, at minimum"],
    ["0.94", "F1 score telling bots from people on behavior alone"],
    ["1 in 5", "searches made by real people return nothing, which points to where the portal can improve"],
  ] as [string, string][],

  after: [
    "I built a dashboard so the team can keep tracking this.",
    "I presented the work at NIST’s SURF colloquium in August 2026, advised by Deoyani Nandrekar Heinis.",
  ],
};
