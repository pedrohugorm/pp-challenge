from bs4 import BeautifulSoup

def fix_html_with_beautifulsoup(html_content):
    """
    Fix HTML syntax using BeautifulSoup.
    Handles cases like TR without table, unclosed tags, etc.
    """
    if not isinstance(html_content, str):
        return html_content
    
    # Parse with BeautifulSoup to fix malformed HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find TR elements that are not inside a table
    tr_elements = soup.find_all('tr')
    for tr in tr_elements:
        # Check if this TR is not inside a table
        if not tr.find_parent('table'):
            print(f"Fixing orphaned TR: {tr}")
            # Create a table wrapper
            table = soup.new_tag('table')
            tr.wrap(table)
            print(f"Wrapped TR in table: {table}")
    
    # Find TD/TH elements that are not inside a TR
    td_th_elements = soup.find_all(['td', 'th'])
    for element in td_th_elements:
        # Check if this TD/TH is not inside a TR
        if not element.find_parent('tr'):
            print(f"Fixing orphaned TD/TH: {element}")
            # Create a TR wrapper, then wrap in table if needed
            tr = soup.new_tag('tr')
            element.wrap(tr)
            # If the TR is not inside a table, wrap it too
            if not tr.find_parent('table'):
                table = soup.new_tag('table')
                tr.wrap(table)
                print(f"Wrapped TD/TH in TR and table: {table}")
    
    # Find LI elements that are not inside a UL/OL
    li_elements = soup.find_all('li')
    for li in li_elements:
        # Check if this LI is not inside a UL or OL
        if not li.find_parent(['ul', 'ol']):
            print(f"Fixing orphaned LI: {li}")
            # Create a UL wrapper
            ul = soup.new_tag('ul')
            li.wrap(ul)
            print(f"Wrapped LI in UL: {ul}")
    
    # Fix unclosed tags by using BeautifulSoup's parser
    # The parser automatically closes unclosed tags
    fixed_html = str(soup)

    return fixed_html

def fix_html_syntax(obj):
    """
    Recursively fix HTML syntax in all string properties in a JSON-like object.
    Returns the object with fixed HTML syntax in the same structure.
    """
    if isinstance(obj, dict):
        return {k: fix_html_syntax(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [fix_html_syntax(item) for item in obj]
    elif isinstance(obj, str):
        # Fix HTML syntax in string properties
        return fix_html_with_beautifulsoup(obj)
    else:
        return obj