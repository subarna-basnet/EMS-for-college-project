"""One short Tarra guide, written for a young reader."""

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = "/Users/subarnabasnet/Tarraa/Tarra/docs/Tarra-simple-guide.pdf"

INK = HexColor("#14222b")
MUTED = HexColor("#3f4e56")
ACCENT = HexColor("#0b3a4a")
PAPER = HexColor("#f4f7f6")
BAND = HexColor("#fff6e8")
RULE = HexColor("#d5dedb")

SECTIONS = [
    (
        "1",
        "What is Tarra?",
        [
            "Tarra is a page on a computer.",
            "It looks at hills and rain.",
            "It is a practice copy. It is not a real town alarm.",
        ],
    ),
    (
        "2",
        "What is a landslide?",
        [
            "A landslide is when mud and rocks slide down a hill.",
            "Lots of rain can make the hill soft.",
            "Then homes and roads below can be hurt.",
        ],
    ),
    (
        "3",
        "Why did we make it?",
        [
            "Old danger maps can be slow to change.",
            "Pictures from space come often, and they are free.",
            "Tarra puts the map, the rain, and the hill in one place.",
        ],
    ),
    (
        "4",
        "The big map",
        [
            "The map is the main part of the page.",
            "You can slide it and zoom in.",
            "You can type a place name, or click a spot.",
            "Two numbers show where that spot is on Earth.",
        ],
    ),
    (
        "5",
        "Practice numbers or real numbers",
        [
            "Demo Data means practice. The page says so.",
            "Live Data means a real open website answered.",
            "If a fact is missing, the page says Data unavailable.",
            "It does not invent a number to fill the gap.",
        ],
    ),
    (
        "6",
        "The score",
        [
            "The score goes from 0 to 100.",
            "A small score means less worry in this practice.",
            "A big score means more worry in this practice.",
            "It is not a promise. It is not 'how sure' a robot is.",
        ],
    ),
    (
        "7",
        "Four colours",
        [
            "Green means Low risk.",
            "Gold means Moderate risk.",
            "Orange means High risk.",
            "Red means Critical, the highest practice level.",
            "The coloured boxes are samples. They are not an official danger map.",
        ],
    ),
    (
        "8",
        "What the score looks at",
        [
            "Rain that fell in the last few days.",
            "How steep the ground is.",
            "If an old landslide in Tarra's small list is close.",
            "If rain or steepness is missing, Tarra leaves it out. It does not guess.",
        ],
    ),
    (
        "9",
        "Pictures from space",
        [
            "Live Data can ask NASA for a before picture and an after picture.",
            "The difference picture only shows where the colours changed.",
            "Clouds can change the picture too. It is not a landslide drawing.",
            "Demo Data shows our own drawings. They say they are not real photos.",
        ],
    ),
    (
        "10",
        "The computer-learning part",
        [
            "The plan is to teach a computer to spot a landslide in a picture.",
            "The names for that plan are CNN, ResNet, and DenseNet.",
            "Those are not turned on yet.",
            "So Tarra does not give a 'how sure' percent. The page says the test is only pretend.",
        ],
    ),
    (
        "11",
        "Alerts",
        [
            "If the score is 60 or more, Tarra writes a practice alert.",
            "One is for the spot you picked. One is for the wider area.",
            "They stay on your computer.",
            "They are not sent to the police, a school, or a village.",
        ],
    ),
    (
        "12",
        "The other pages",
        [
            "Monitor is the map and the score.",
            "Imagery is the before and after pictures.",
            "Pipeline is the step list, from picture to alert.",
            "Alerts is the list of practice alerts.",
            "Data and sources tells you where each fact comes from.",
        ],
    ),
    (
        "13",
        "Where the facts come from",
        [
            "The map is OpenStreetMap, drawn by many people.",
            "In Live Data, rain and hill height come from Open-Meteo.",
            "Space pictures come from NASA.",
            "Other science sites are named on the sources page. Tarra does not call all of them yet.",
        ],
    ),
    (
        "14",
        "The most important rule",
        [
            "Do not use Tarra alone to decide to leave your home.",
            "If you are scared of a real storm or a moving hill, tell a grown-up.",
            "Listen to your family, your teachers, and the official helpers.",
        ],
    ),
    (
        "15",
        "How a grown-up opens it",
        [
            "Open the folder Tarraa, then the folder Tarra.",
            "They run npm install, then npm test, then npm run dev.",
            "Then they open the page in a web browser.",
            "It starts in Demo Data, on a sample place in Wayanad.",
        ],
    ),
]


def make_styles():
    title = ParagraphStyle(
        "title",
        fontName="Times-Bold",
        fontSize=32,
        leading=36,
        textColor=ACCENT,
        alignment=TA_LEFT,
        spaceAfter=2,
    )
    sub = ParagraphStyle(
        "sub",
        fontName="Times-Italic",
        fontSize=13,
        leading=17,
        textColor=MUTED,
        spaceAfter=6,
    )
    intro = ParagraphStyle(
        "intro",
        fontName="Times-Roman",
        fontSize=12,
        leading=16,
        textColor=INK,
    )
    head = ParagraphStyle(
        "head",
        fontName="Times-Bold",
        fontSize=14,
        leading=18,
        textColor=ACCENT,
        spaceBefore=0,
        spaceAfter=2,
    )
    body = ParagraphStyle(
        "body",
        fontName="Times-Roman",
        fontSize=12,
        leading=16,
        textColor=INK,
    )
    note = ParagraphStyle(
        "note",
        fontName="Times-Italic",
        fontSize=9,
        leading=12,
        textColor=MUTED,
    )
    return title, sub, intro, head, body, note


def section(number, title, lines, head, body):
    bits = [Paragraph(f"{number}.  {title}", head)]
    for line in lines:
        bits.append(Paragraph(line, body))
        bits.append(Spacer(1, 1.5 * mm))
    bits.append(Spacer(1, 2.2 * mm))
    return KeepTogether(bits)


def draw_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(ACCENT)
    canvas.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#c4552a"))
    canvas.rect(0, 0, width, 3 * mm, fill=1, stroke=0)
    canvas.setFillColor(MUTED)
    canvas.setFont("Times-Roman", 8)
    canvas.drawString(18 * mm, 7 * mm, "Tarra is for learning. It cannot tell you to leave your home.")
    canvas.drawRightString(width - 18 * mm, 7 * mm, str(doc.page))
    canvas.restoreState()


def main():
    title, sub, intro, head, body, note = make_styles()
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="Tarra, a simple guide",
        author="Tarra prototype",
    )
    story = []
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Tarra", title))
    story.append(Paragraph("A short guide, one idea at a time", sub))
    story.append(Spacer(1, 2 * mm))
    banner = Paragraph(
        "Read these in order. Each part is short. Ask a grown-up if a word is new.",
        intro,
    )
    wrap = Table([[banner]], colWidths=[174 * mm])
    wrap.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BAND),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BOX", (0, 0), (-1, -1), 0.4, RULE),
            ]
        )
    )
    story.append(wrap)
    story.append(Spacer(1, 6 * mm))

    for number, name, lines in SECTIONS:
        story.append(section(number, name, lines, head, body))

    story.append(Spacer(1, 2 * mm))
    grown = Paragraph(
        "Words for grown-ups: Tarra is a research prototype. Risk estimates are based on "
        "available data and models and should not be used as the sole basis for emergency "
        "or evacuation decisions.",
        note,
    )
    box = Table([[grown]], colWidths=[174 * mm])
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.4, RULE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(box)
    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    print(OUT)


if __name__ == "__main__":
    main()
