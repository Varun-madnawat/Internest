from pipeline.Section_detection import layer1

def parse_resume(pdf_path):

    data = layer1.styled_text(pdf_path)

    return data
