import { stripIndents } from 'common-tags';
import { v4 as uuid } from 'uuid';

const renderMetadataXmp = (metadata: string) => {
  return `
    <?xpacket id="${uuid()}"?>
    <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 9.1-c002 79.2c0288b, 2024/01/23-06:33:24        ">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:subject>
        <rdf:Bag>
        <rdf:li>${metadata}</rdf:li>
        </rdf:Bag>
      </dc:subject>
      </rdf:Description>
    </rdf:RDF>
    </x:xmpmeta>        
    <?xpacket end="w"?>  
  `;
};

const renderBridgeKeywords = (keywords: string[]) => {
  const appliedKeywords = [...keywords]
    .sort()
    .map((keyword) => `<item name="${keyword}" />`)
    .join('\n');

  return stripIndents`
    <?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
    <keywords version="2">
      ${appliedKeywords}
    </keywords>
  `;
};

export { renderMetadataXmp, renderBridgeKeywords };
